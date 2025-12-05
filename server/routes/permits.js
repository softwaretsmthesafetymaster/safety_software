import express from 'express';
import mongoose from 'mongoose';
import Permit from '../models/Permit.js';
import Company from '../models/Company.js';
import Plant from '../models/Plant.js';
import Area from '../models/Area.js';
import User from '../models/User.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import notificationService from '../services/permitNotification.js';
import reminderService from '../services/reminderService.js';
import NumberGenerator from '../utils/numberGenerator.js';
import {
    validatePermitCreation,
    validatePermitApproval,
    validateCompanyId,
    validateObjectId,
    validatePagination,
    validate
} from '../middleware/validation.js';

const router = express.Router();

/**
 * Build role-aware filter for permits
 */
function buildPermitFilterForRole(user, companyId, extra = {}) {
    if (!user) return null;
    const base = { companyId: new mongoose.Types.ObjectId(companyId), ...extra };

    switch (user.role) {
        case 'company_owner':
        case 'admin':
            return base;

        case 'plant_head':
            if (!user.plantId) return null;
            return { ...base, plantId: new mongoose.Types.ObjectId(user.plantId) };

        case 'hod':
        case 'safety_incharge':
            return {
                ...base,
                $or: [
                    { 'approvals.approver': new mongoose.Types.ObjectId(user._id) },
                    { 'closure.approvedBy': new mongoose.Types.ObjectId(user._id) },
                    { requestedBy: new mongoose.Types.ObjectId(user._id) },
                    { areaId: { $in: user.areaIds || [] } }
                ]
            };

        case 'worker':
        case 'contractor':
        case 'user':
            return { ...base, requestedBy: new mongoose.Types.ObjectId(user._id) };

        default:
            return null;
    }
}

/**
 * Assign approvers for a new permit based on company config
 */
async function _assignApproversAndFlows(ptwConfig, reqBody, companyId) {
    const { isHighRisk, areaId, plantId, types } = reqBody;
    const approvalFlowConfig = isHighRisk
        ? ptwConfig.highRiskApprovalFlow || []
        : ptwConfig.approvalFlow || [];

    const objectIdAreaId = new mongoose.Types.ObjectId(areaId);
    const objectIdPlantId = new mongoose.Types.ObjectId(plantId);
    const area = await Area.findById(objectIdAreaId).lean();
    if (!area) throw new Error('Area not found.');

    // Determine high-risk based on permit types
    const highRiskTypes = ['electrical', 'confinedSpace', 'workAtHeight', 'hotWork', 'chemical', 'radiation'];
    const isHighRiskByType = types.some(type => highRiskTypes.includes(type));

    const approvals = await Promise.all(
        approvalFlowConfig.map(async step => {
            let approverId = null;
            if (step.role === 'hod') approverId = area.personnel?.hod;
            else if (step.role === 'safety_incharge') approverId = area.personnel?.safetyIncharge;
            else if (step.role === 'plant_head') {
                const user = await User.findOne({
                    companyId,
                    plantId: objectIdPlantId,
                    role: 'plant_head'
                }).lean();
                if (user) approverId = user._id;
            }
            return {
                step: step.step,
                role: step.role,
                label: step.label,
                approver: approverId ? new mongoose.Types.ObjectId(approverId) : null,
                status: 'pending',
                required: step.required !== false
            };
        })
    );

    const closureApprovers = (ptwConfig.closureFlow?.anyOf || [])
        .map(role => {
            if (role === 'hod') return area.personnel?.hod;
            if (role === 'safety_incharge') return area.personnel?.safetyIncharge;
            return null;
        })
        .filter(id => id)
        .map(id => new mongoose.Types.ObjectId(id));

    const stopWorkRoles = await Promise.all(
        (ptwConfig.stopWorkRoles || []).map(async roleConfig => {
            let userId = null;
            if (roleConfig.role === 'hod') userId = area.personnel?.hod;
            else if (roleConfig.role === 'safety_incharge') userId = area.personnel?.safetyIncharge;
            else if (roleConfig.role === 'plant_head') {
                const user = await User.findOne({
                    companyId,
                    plantId: objectIdPlantId,
                    role: 'plant_head'
                }).lean();
                if (user) userId = user._id;
            }
            return { ...roleConfig, userId: userId ? new mongoose.Types.ObjectId(userId) : null };
        })
    );

    return { approvals, closureApprovers, stopWorkRoles, isHighRisk: isHighRiskByType || isHighRisk };
}

/**
 * GET all permits with filters
 */
router.get('/:companyId',
    validateCompanyId,
    validatePagination,
    validate,
    authenticate,
    checkCompanyAccess,
    async (req, res) => {
        try {
            const { companyId } = req.params;
            const { 
                page = 1, 
                limit = 10, 
                status, 
                plantId, 
                type, 
                areaId, 
                search,
                startDate,
                endDate,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            const baseFilter = buildPermitFilterForRole(req.user, companyId);
            if (!baseFilter) {
                return res.status(403).json({ message: 'Not authorized to access company permits' });
            }

            const filter = { ...baseFilter };
            if (status) filter.status = status;
            if (plantId) filter.plantId = new mongoose.Types.ObjectId(plantId);
            if (areaId) filter.areaId = new mongoose.Types.ObjectId(areaId);
            if (type) filter.types = { $in: [type] };
            
            if (search) {
                const regex = new RegExp(String(search), 'i');
                filter.$or = [
                    { workDescription: regex },
                    { permitNumber: regex },
                    { 'contractor.name': regex }
                ];
            }

            if (startDate || endDate) {
                filter['schedule.startDate'] = {};
                if (startDate) filter['schedule.startDate'].$gte = new Date(startDate);
                if (endDate) filter['schedule.startDate'].$lte = new Date(endDate);
            }

            const skip = (Number(page) - 1) * Number(limit);
            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const [permits, total] = await Promise.all([
                Permit.find(filter)
                    .populate('requestedBy', 'name email role')
                    .populate('plantId', 'name code')
                    .populate('areaId', 'name personnel.hod personnel.safetyIncharge')
                    .populate('approvals.approver', 'name role email')
                    .populate('signatures.user', 'name role')
                    .sort(sortOptions)
                    .limit(Number(limit))
                    .skip(skip),
                Permit.countDocuments(filter)
            ]);

            res.json({
                permits,
                totalPages: Math.ceil(total / Number(limit)),
                currentPage: Number(page),
                total
            });
        } catch (err) {
            console.error('Error fetching permits:', err);
            res.status(500).json({ message: err.message });
        }
    }
);

/**
 * CREATE permit
 */
router.post('/:companyId',
    validateCompanyId,
    validatePermitCreation,
    validate,
    authenticate,
    checkCompanyAccess,
    async (req, res) => {
        try {
            const { companyId } = req.params;
            const company = await Company.findById(companyId);
            if (!company) return res.status(404).json({ message: 'Company not found' });

            const ptwConfig = company.config?.modules?.ptw || {};

            const { approvals, closureApprovers, stopWorkRoles, isHighRisk } =
                await _assignApproversAndFlows(ptwConfig, req.body, companyId);

            // Calculate expiry time
            const defaultExpiryHours = ptwConfig.defaultExpiryHours || 8;
            const expiresAt = req.body.schedule?.endDate ? 
                new Date(req.body.schedule.endDate) : 
                new Date(Date.now() + defaultExpiryHours * 60 * 60 * 1000);

            const permit = new Permit({
                ...req.body,
                companyId: new mongoose.Types.ObjectId(companyId),
                plantId: new mongoose.Types.ObjectId(req.body.plantId),
                areaId: new mongoose.Types.ObjectId(req.body.areaId),
                isHighRisk,
                status: 'draft',
                requestedBy: new mongoose.Types.ObjectId(req.user._id),
                permitNumber: await NumberGenerator.generateNumber(companyId, 'ptw'),
                approvals,
                expiresAt,
                closureFlow: closureApprovers.map((approverId, index) => ({
                    step: index + 1,
                    role: index === 0 ? 'hod' : 'safety_incharge',
                    label: index === 0 ? 'HOD Approval' : 'Safety Approval',
                    required: true,
                    approver: approverId,
                    status: 'pending'
                })),
                stopWorkRoles
            });

            await permit.save();
            await permit.populate([
                { path: 'requestedBy', select: 'name email role' },
                { path: 'plantId', select: 'name code' },
                { path: 'areaId', select: 'name' },
                { path: 'approvals.approver', select: 'name role email' }
            ]);

            // Schedule expiry reminder
            if (permit.expiresAt) {
                try {
                    await reminderService.schedulePermitExpiryReminder(permit);
                } catch (reminderError) {
                    console.warn('Failed to schedule reminder:', reminderError);
                }
            }

            res.status(201).json({ message: 'Permit created successfully', permit });
        } catch (err) {
            console.error('Error creating permit:', err);
            res.status(500).json({ message: err.message });
        }
    }
);

/**
 * GET permit by ID
 */
router.get('/:companyId/:id',
    validateCompanyId,
    validateObjectId('id'),
    validate,
    authenticate,
    checkCompanyAccess,
    async (req, res) => {
        try {
            const { companyId, id } = req.params;
            const filter = buildPermitFilterForRole(req.user, companyId, { _id: new mongoose.Types.ObjectId(id) });
            if (!filter) {
                return res.status(403).json({ message: 'Not authorized to access this permit' });
            }

            const permit = await Permit.findOne(filter)
                .populate('requestedBy', 'name email role')
                .populate('plantId', 'name code')
                .populate('areaId', 'name hod safetyIncharge')
                .populate('approvals.approver', 'name role email')
                .populate('signatures.user', 'name role')
                .populate('activatedBy', 'name role')
                .populate('closure.submittedBy', 'name role')
                .populate('closure.approvedBy', 'name role')
                .populate('stopDetails.stoppedBy', 'name role');

            if (!permit) return res.status(404).json({ message: 'Permit not found' });

            res.json({ permit });
        } catch (err) {
            console.error('Error fetching permit:', err);
            res.status(500).json({ message: err.message });
        }
    }
);

/**
 * UPDATE permit
 */
router.put('/:companyId/:id',
    validateCompanyId,
    validateObjectId('id'),
    validate,
    authenticate,
    checkCompanyAccess,
    async (req, res) => {
        try {
            const { companyId, id } = req.params;
            const filter = buildPermitFilterForRole(req.user, companyId, { _id: new mongoose.Types.ObjectId(id) });
            if (!filter) {
                return res.status(403).json({ message: 'Not authorized to update this permit' });
            }

            const permit = await Permit.findOne(filter);
            if (!permit) return res.status(404).json({ message: 'Permit not found' });

            if (permit.status !== 'draft') {
                return res.status(400).json({ message: 'Can only update draft permits' });
            }

            const updatedPermit = await Permit.findByIdAndUpdate(
                id,
                { ...req.body, updatedAt: new Date() },
                { new: true }
            ).populate([
                { path: 'requestedBy', select: 'name email role' },
                { path: 'plantId', select: 'name code' },
                { path: 'areaId', select: 'name' },
                { path: 'approvals.approver', select: 'name role email' }
            ]);

            res.json({ message: 'Permit updated successfully', permit: updatedPermit });
        } catch (err) {
            console.error('Error updating permit:', err);
            res.status(500).json({ message: err.message });
        }
    }
);

/**
 * SUBMIT permit for approval
 */
router.post('/:companyId/:id/submit',
    authenticate,
    checkCompanyAccess,
    validateObjectId('id'),
    validate,
    async (req, res) => {
        try {
            const { companyId, id } = req.params;
            const filter = buildPermitFilterForRole(req.user, companyId, { _id: new mongoose.Types.ObjectId(id) });

            if (!filter) {
                return res.status(403).json({ message: 'Not authorized to submit this permit' });
            }

            const permit = await Permit.findOne(filter).populate('approvals.approver', 'name email role');
            if (!permit) return res.status(404).json({ message: 'Permit not found' });

            if (permit.status !== 'draft') {
                return res.status(400).json({ message: 'Permit already submitted' });
            }

            permit.status = 'submitted';
            if (permit.approvals && permit.approvals.length > 0) {
                permit.approvals[0].status = 'pending';
            }

            await permit.save();

            // Send notification to first approver
            if (permit.approvals && permit.approvals.length > 0 && permit.approvals[0].approver) {
                await notificationService.notifyPermitSubmitted(permit, permit.approvals[0].approver._id);
            }

            res.json({ message: 'Permit submitted for approval', permit });
        } catch (err) {
            console.error('Error submitting permit:', err);
            res.status(500).json({ message: err.message });
        }
    }
);

/**
 * APPROVE or REJECT permit
 */
router.post('/:companyId/:id/approve',
    authenticate,
    checkCompanyAccess,
    validateObjectId('id'),
    validate,
    async (req, res) => {
        try {
            const { companyId, id } = req.params;
            const { decision, comments, conditions = [] } = req.body;

            if (!['approve', 'reject'].includes(decision)) {
                return res.status(400).json({ message: 'Invalid decision' });
            }

            const permit = await Permit.findById(id).populate('approvals.approver', 'name email role');
            if (!permit) return res.status(404).json({ message: 'Permit not found' });

            const currentApproval = permit.approvals.find(a => a.status === 'pending');
            if (!currentApproval) {
                return res.status(400).json({ message: 'No pending approval found' });
            }

            if (String(currentApproval.approver._id) !== String(req.user._id)) {
                return res.status(403).json({ message: 'Not authorized for this approval step' });
            }

            // Update current approval
            currentApproval.status = decision === 'approve' ? 'approved' : 'rejected';
            currentApproval.comments = comments;
            currentApproval.timestamp = new Date();
            if (conditions.length > 0) {
                currentApproval.conditions = conditions;
            }

            if (decision === 'approve') {
                const nextStep = permit.approvals.find(a => a.step === currentApproval.step + 1);
                if (nextStep) {
                    // Move to next approval step
                    nextStep.status = 'pending';
                    permit.status = 'submitted';
                    await notificationService.notifyPermitSubmitted(permit, nextStep.approver);
                } else {
                    // All approvals completed - move to approved status
                    permit.status = 'approved';
                    const company = await Company.findById(companyId);
                    const ptwConfig = company?.config?.modules?.ptw;
                    const expiryHours = ptwConfig?.defaultExpiryHours || 8;
                    permit.expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

                    await notificationService.notifyPermitApproved(permit);
                }
            } else {
                // Permit rejected
                permit.status = 'rejected';
                await notificationService.notifyPermitRejected(permit, comments);
            }

            await permit.save();
            res.json({ message: `Permit ${decision}d successfully`, permit });
        } catch (err) {
            console.error('Error processing approval:', err);
            res.status(500).json({ message: err.message });
        }
    }
);

/**
 * ACTIVATE permit
 */
router.post('/:companyId/:id/activate',
    authenticate,
    checkCompanyAccess,
    validateObjectId('id'),
    validate,
    async (req, res) => {
        try {
            const { companyId, id } = req.params;

            const filter = buildPermitFilterForRole(req.user, companyId, { _id: new mongoose.Types.ObjectId(id) });
            if (!filter) {
                return res.status(403).json({ message: 'Not authorized to activate this permit' });
            }

            const permit = await Permit.findOne(filter);
            if (!permit) return res.status(404).json({ message: 'Permit not found' });

            if (permit.status !== 'approved') {
                return res.status(400).json({ message: 'Permit must be approved before activation' });
            }

            if (String(permit.requestedBy) !== String(req.user._id)) {
                return res.status(403).json({ message: 'Only the permit requestor can activate the permit' });
            }

            permit.status = 'active';
            permit.activatedAt = new Date();
            permit.activatedBy = new mongoose.Types.ObjectId(req.user._id);

            await permit.save();

            // Reschedule expiry reminder for active permit
            if (permit.expiresAt) {
                try {
                    await reminderService.schedulePermitExpiryReminder(permit);
                } catch (reminderError) {
                    console.warn('Failed to reschedule reminder:', reminderError);
                }
            }

            await notificationService.notifyPermitActivated(permit);

            res.json({ message: 'Permit activated successfully', permit });
        } catch (err) {
            console.error('Error activating permit:', err);
            res.status(500).json({ message: err.message });
        }
    }
);

/**
 * CLOSE permit
 */
router.post('/:companyId/:id/close',
    authenticate,
    checkCompanyAccess,
    validateObjectId('id'),
    validate,
    async (req, res) => {
        try {
            const { companyId, id } = req.params;
            const { closureData, approvalDecision } = req.body;
            
            const permit = await Permit.findById(id);
            if (!permit) return res.status(404).json({ message: 'Permit not found' });

            if (approvalDecision) {
                // This is a closure approval
                if (!['approve', 'reject'].includes(approvalDecision)) {
                    return res.status(400).json({ message: 'Invalid approval decision' });
                }

                const canApprove = permit.closureFlow.some(
                    flow => flow.status === 'pending' && 
                    ['hod', 'safety_incharge','plant_head'].includes(req.user.role)
                );

                if (!canApprove) {
                    return res.status(403).json({ message: 'Not authorized to approve closure' });
                }

                if (approvalDecision === 'approve') {
                    // Update closure flow
                    const pendingStep = permit.closureFlow.find(f => f.status === 'pending');
                    if (pendingStep) {
                        pendingStep.status = 'approved';
                        pendingStep.approver = req.user._id;
                        pendingStep.timestamp = new Date();
                    }

                    // Check if all closure approvals are complete
                    const allApproved = permit.closureFlow.every(f => f.status === 'approved');
                    if (allApproved) {
                        permit.status = 'closed';
                        permit.closure.approvedBy = req.user._id;
                        permit.closure.approvedAt = new Date();
                        await notificationService.notifyPermitClosed(permit);
                    } else {
                        permit.status = 'pending_closure';
                    }
                } else {
                    // Reject closure
                    permit.status = 'active';
                    permit.closure = undefined;
                }

                await permit.save();
                res.json({ 
                    message: approvalDecision === 'approve' ? 'Closure approved' : 'Closure rejected', 
                    permit 
                });
                return;
            }

            // This is a closure submission
            const authorizedToClose = String(permit.requestedBy) === String(req.user._id) || 
                                   ['hod', 'safety_incharge','plant_head'].includes(req.user.role);
            
            if (!authorizedToClose) {
                return res.status(403).json({ message: 'Not authorized to close permit' });
            }

            if (!['active', 'expired'].includes(permit.status)) {
                return res.status(400).json({ message: 'Permit cannot be closed in current status' });
            }

            // Set closure data
            permit.closure = {
                ...closureData,
                submittedBy: req.user._id,
                submittedAt: new Date()
            };

            // Check if approval is required
            if (permit.closureFlow && permit.closureFlow.length > 0) {
                permit.status = 'pending_closure';
                // Set first closure step to pending
                if (permit.closureFlow[0]) {
                    permit.closureFlow[0].status = 'pending';
                }
            } else {
                // Direct closure without approval
                permit.status = 'closed';
                permit.closure.approvedBy = req.user._id;
                permit.closure.approvedAt = new Date();
                await notificationService.notifyPermitClosed(permit);
            }

            await permit.save();
            res.json({ message: 'Permit closure submitted successfully', permit });
        } catch (err) {
            console.error('Error closing permit:', err);
            res.status(500).json({ message: err.message });
        }
    }
);

/**
 * STOP permit (Emergency stop)
 */
router.post('/:companyId/:id/stop',
    authenticate,
    checkCompanyAccess,
    validateObjectId('id'),
    validate,
    async (req, res) => {
        try {
            const { companyId, id } = req.params;
            const { stopData } = req.body;

            const permit = await Permit.findById(id);
            if (!permit) return res.status(404).json({ message: 'Permit not found' });

            if (permit.status !== 'active') {
                return res.status(400).json({ message: 'Only active permits can be stopped' });
            }

            // Check authorization
            const authorizedToStop = permit.stopWorkRoles.some(
                role => role.userId && String(role.userId) === String(req.user._id)
            ) || ['hod', 'safety_incharge', 'plant_head', 'admin'].includes(req.user.role);

            if (!authorizedToStop) {
                return res.status(403).json({ message: 'Not authorized to stop this permit' });
            }

            permit.status = 'stopped';
            permit.stopDetails = {
                ...stopData,
                stoppedBy: req.user._id,
                stoppedAt: new Date()
            };

            await permit.save();
            await notificationService.notifyPermitStopped(permit);

            res.json({ message: 'Permit stopped successfully', permit });
        } catch (err) {
            console.error('Error stopping permit:', err);
            res.status(500).json({ message: err.message });
        }
    }
);

/**
 * EXTEND permit
 */
router.post('/:companyId/:id/extension',
    authenticate,
    checkCompanyAccess,
    validateObjectId('id'),
    validate,
    async (req, res) => {
        try {
            const { companyId, id } = req.params;
            const { extensionHours, extensionReason, comments } = req.body;

            const permit = await Permit.findById(id);
            if (!permit) return res.status(404).json({ message: 'Permit not found' });

            if (!['active', 'expired'].includes(permit.status)) {
                return res.status(400).json({ message: 'Permit cannot be extended in current status' });
            }

            const company = await Company.findById(companyId);
            const ptwConfig = company?.config?.modules?.ptw;
            
            // Check authorization for extension
            const extensionRoles = ptwConfig?.extensionFlow || [
                { role: 'hod', maxHours: 12 },
                { role: 'safety_incharge', maxHours: 24 },
                { role: 'plant_head', maxHours: 48 }
            ];

            const userExtensionAuth = extensionRoles.find(flow => flow.role === req.user.role);
            if (!userExtensionAuth) {
                return res.status(403).json({ message: 'Not authorized to extend permits' });
            }

            if (extensionHours > userExtensionAuth.maxHours) {
                return res.status(400).json({ 
                    message: `Cannot extend more than ${userExtensionAuth.maxHours} hours with your role` 
                });
            }

            // Add extension to history
            const extension = {
                hours: extensionHours,
                reason: extensionReason,
                requestedBy: req.user._id,
                requestedAt: new Date(),
                approvedBy: req.user._id,
                approvedAt: new Date(),
                comments
            };

            if (!permit.extensions) {
                permit.extensions = [];
            }
            permit.extensions.push(extension);

            // Update expiry time
            const currentExpiry = permit.expiresAt || new Date();
            permit.expiresAt = new Date(currentExpiry.getTime() + extensionHours * 60 * 60 * 1000);

            // If permit was expired, reactivate it
            if (permit.status === 'expired') {
                permit.status = 'active';
            }

            await permit.save();

            // Reschedule expiry reminder
            try {
                await reminderService.schedulePermitExpiryReminder(permit);
            } catch (reminderError) {
                console.warn('Failed to reschedule reminder:', reminderError);
            }

            await notificationService.notifyPermitExtended(permit, comments);

            res.json({ message: 'Permit extended successfully', permit });
        } catch (err) {
            console.error('Error extending permit:', err);
            res.status(500).json({ message: err.message });
        }
    }
);

/**
 * GET dashboard statistics
 */
router.get('/:companyId/stats/dashboard',
    validateCompanyId,
    authenticate,
    checkCompanyAccess,
    async (req, res) => {
        try {
            const { companyId } = req.params;

            const baseFilter = buildPermitFilterForRole(req.user, companyId);
            if (!baseFilter) {
                return res.status(403).json({ message: 'Not authorized to access statistics' });
            }

            // Current month filter
            const now = new Date();
            const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

            const [
                total,
                active,
                expired,
                pending,
                closed,
                draft,
                highRisk,
                thisMonth,
                lastMonth,
                recentPermits,
                monthlyData,
                statusDistribution,
                typeDistribution,
                plantDistribution
            ] = await Promise.all([
                Permit.countDocuments(baseFilter),
                Permit.countDocuments({ ...baseFilter, status: 'active' }),
                Permit.countDocuments({ ...baseFilter, status: 'expired' }),
                Permit.countDocuments({ 
                    ...baseFilter, 
                    status: { $in: ['submitted', 'pending_closure'] } 
                }),
                Permit.countDocuments({ ...baseFilter, status: 'closed' }),
                Permit.countDocuments({ ...baseFilter, status: 'draft' }),
                Permit.countDocuments({ ...baseFilter, isHighRisk: true }),
                Permit.countDocuments({ 
                    ...baseFilter, 
                    createdAt: { $gte: startOfCurrentMonth } 
                }),
                Permit.countDocuments({ 
                    ...baseFilter, 
                    createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
                }),
                Permit.find(baseFilter)
                    .populate('requestedBy', 'name')
                    .populate('plantId', 'name code')
                    .sort({ createdAt: -1 })
                    .limit(10),
                // Monthly statistics for last 6 months
                Permit.aggregate([
                    { $match: baseFilter },
                    {
                        $group: {
                            _id: {
                                year: { $year: '$createdAt' },
                                month: { $month: '$createdAt' }
                            },
                            total: { $sum: 1 },
                            active: {
                                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                            },
                            completed: {
                                $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
                            }
                        }
                    },
                    { $sort: { '_id.year': -1, '_id.month': -1 } },
                    { $limit: 6 }
                ]),
                // Status distribution
                Permit.aggregate([
                    { $match: baseFilter },
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ]),
                // Type distribution
                Permit.aggregate([
                    { $match: baseFilter },
                    { $unwind: '$types' },
                    { $group: { _id: '$types', count: { $sum: 1 } } },
                    { $limit: 10 }
                ]),
                // Plant distribution
                Permit.aggregate([
                    { $match: baseFilter },
                    { 
                        $lookup: {
                            from: 'plants',
                            localField: 'plantId',
                            foreignField: '_id',
                            as: 'plant'
                        }
                    },
                    { $unwind: '$plant' },
                    { $group: { _id: '$plant.name', count: { $sum: 1 } } }
                ])
            ]);

            const monthlyTrend = monthlyData.reverse().map(item => ({
                month: new Date(item._id.year, item._id.month - 1).toLocaleDateString('en', { 
                    month: 'short', 
                    year: 'numeric' 
                }),
                total: item.total,
                active: item.active,
                completed: item.completed
            }));

            res.json({
                stats: {
                    total,
                    active,
                    expired,
                    pending,
                    closed,
                    draft,
                    highRisk,
                    thisMonth,
                    lastMonth,
                    growth: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1) : '0',
                    recentPermits,
                    monthlyData: monthlyTrend,
                    statusDistribution: statusDistribution.map(s => ({
                        name: s._id,
                        value: s.count
                    })),
                    typeDistribution: typeDistribution.map(t => ({
                        type: t._id,
                        count: t.count
                    })),
                    plantDistribution: plantDistribution.map(p => ({
                        plant: p._id,
                        count: p.count
                    }))
                }
            });
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            res.status(500).json({ message: err.message });
        }
    }
);

/**
 * DELETE permit (only drafts)
 */
router.delete('/:companyId/:id',
    authenticate,
    checkCompanyAccess,
    validateObjectId('id'),
    validate,
    async (req, res) => {
        try {
            const { companyId, id } = req.params;
            
            const filter = buildPermitFilterForRole(req.user, companyId, { _id: new mongoose.Types.ObjectId(id) });
            if (!filter) {
                return res.status(403).json({ message: 'Not authorized to delete this permit' });
            }

            const permit = await Permit.findOne(filter);
            if (!permit) return res.status(404).json({ message: 'Permit not found' });

            if (permit.status !== 'draft') {
                return res.status(400).json({ message: 'Only draft permits can be deleted' });
            }

            await Permit.findByIdAndDelete(id);
            res.json({ message: 'Permit deleted successfully' });
        } catch (err) {
            console.error('Error deleting permit:', err);
            res.status(500).json({ message: err.message });
        }
    }
);

export default router;