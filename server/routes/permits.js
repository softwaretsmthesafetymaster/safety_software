import express from 'express';
import mongoose from 'mongoose';
import Permit from '../models/Permit.js';
import Company from '../models/Company.js';
import Plant from '../models/Plant.js';
import Area from '../models/Area.js';
import User from '../models/User.js';
import { authenticate, checkCompanyAccess } from '../middleware/auth.js';
import notificationService from '../services/notificationService.js';
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
    const { isHighRisk, areaId, plantId } = reqBody;
    const approvalFlowConfig = isHighRisk
        ? ptwConfig.highRiskApprovalFlow || []
        : ptwConfig.approvalFlow || [];

    const objectIdAreaId = new mongoose.Types.ObjectId(areaId);
    const objectIdPlantId = new mongoose.Types.ObjectId(plantId);
    const area = await Area.findById(objectIdAreaId).lean();
    if (!area) throw new Error('Area not found.');

    const approvals = await Promise.all(
        approvalFlowConfig.map(async step => {
            let approverId = null;
            if (step.role === 'hod') approverId = area.hod;
            else if (step.role === 'safety_incharge') approverId = area.safetyIncharge;
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
                status: 'pending'
            };
        })
    );

    const closureApprovers = (ptwConfig.closureFlow?.anyOf || [])
        .map(role => {
            if (role === 'hod') return area.hod;
            if (role === 'safety_incharge') return area.safetyIncharge;
            return null;
        })
        .filter(id => id)
        .map(id => new mongoose.Types.ObjectId(id));

    const stopWorkRoles = await Promise.all(
        (ptwConfig.stopWorkRoles || []).map(async roleConfig => {
            let userId = null;
            if (roleConfig.role === 'hod') userId = area.hod;
            else if (roleConfig.role === 'safety_incharge') userId = area.safetyIncharge;
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

    return { approvals, closureApprovers, stopWorkRoles };
}

/**
 * Utility: deny if filter is null
 */
function denyIfNoFilter(filter, res) {
    if (!filter) {
        res.status(403).json({ message: 'Not authorized to access company permits' });
        return true;
    }
    return false;
}

/**
 * ================================
 * ROUTES
 * ================================
 */

/**
 * GET all permits
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
            const { page = 1, limit = 10, status, plantId, type, areaId, search } = req.query;

            const baseFilter = buildPermitFilterForRole(req.user, companyId);
            if (denyIfNoFilter(baseFilter, res)) return;

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

            const skip = (Number(page) - 1) * Number(limit);

            const [permits, total] = await Promise.all([
                Permit.find(filter)
                    .populate('requestedBy', 'name email role')
                    .populate('plantId', 'name code')
                    .populate('areaId', 'name hod safetyIncharge')
                    .populate('approvals.approver', 'name role email')
                    .sort({ createdAt: -1 })
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

            const ptwConfig = company.config?.ptw;
            if (!ptwConfig) return res.status(400).json({ message: 'PTW module not configured' });

            const { approvals, closureApprovers, stopWorkRoles } =
                await _assignApproversAndFlows(ptwConfig, req.body, companyId);

            const permit = new Permit({
                ...req.body,
                companyId: new mongoose.Types.ObjectId(companyId),
                isHighRisk: req.body.isHighRisk || false,
                status: ptwConfig.statusMap.draft,
                requestedBy: new mongoose.Types.ObjectId(req.user._id),
                permitNumber: await NumberGenerator.generateNumber(companyId, 'ptw'),
                approvals,
                closureFlow: {
                    roles: closureApprovers,
                    label: ptwConfig.closureFlow?.label || 'Closure Approval'
                },
                stopWorkRoles
            });

            await permit.save();
            await permit.populate([
                { path: 'requestedBy', select: 'name email' },
                { path: 'plantId', select: 'name code' },
                { path: 'areaId', select: 'name' }
            ]);

            if (permit.schedule?.endDate) {
                try { await reminderService.schedulePermitExpiryReminder(permit); }
                catch (rerr) { console.warn('Failed to schedule reminder:', rerr); }
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
            if (denyIfNoFilter(filter, res)) return;

            const permit = await Permit.findOne(filter)
                .populate('requestedBy', 'name email role')
                .populate('plantId', 'name code')
                .populate('areaId', 'name hod safetyIncharge')
                .populate('approvals.approver', 'name role email')
                .populate('signatures.user', 'name role');

            if (!permit) return res.status(404).json({ message: 'Permit not found' });

            res.json({ permit });
        } catch (err) {
            console.error('Error fetching permit:', err);
            res.status(500).json({ message: err.message });
        }
    }
);

/**
 * SUBMIT permit
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

            if (denyIfNoFilter(filter, res)) return;

            const permit = await Permit.findOne(filter);
            if (!permit) return res.status(404).json({ message: 'Permit not found' });

            if (permit.status !== 'draft') return res.status(400).json({ message: 'Permit already submitted' });

            permit.status = 'submitted';
            if (permit.approvals?.length > 0) permit.approvals[0].status = 'pending';

            await permit.save();
            await notificationService.notifyPermitSubmitted(permit, permit.approvals[0]?.approver);

            res.json({ message: 'Permit submitted for approval', permit });
        } catch (err) {
            console.error('Error submitting permit:', err);
            res.status(500).json({ message: err.message });
        }
    }
);

/**
 * APPROVE / REJECT permit
 */
router.post('/:companyId/:id/approve',
    authenticate,
    checkCompanyAccess,
    validateObjectId('id'),
    validate,
    async (req, res) => {
        try {
            const { companyId, id } = req.params;
            const { decision, comments } = req.body;
            const company = await Company.findById(companyId);
            const ptwConfig = company.config?.ptw;
            const permit = await Permit.findById(id);

            const currentApproval = permit.approvals.find(a => a.status === 'pending');
            if (!currentApproval) return res.status(400).json({ message: 'No pending approval' });
            if (String(currentApproval.approver) !== String(req.user._id))
                return res.status(403).json({ message: 'Not your approval step' });

            currentApproval.status = decision === 'approve' ? 'approved' : 'rejected';
            currentApproval.comments = comments;
            currentApproval.timestamp = new Date();

            if (decision === 'approve') {
                const nextStep = permit.approvals.find(a => a.step === currentApproval.step + 1);
                if (nextStep) {
                    nextStep.status = 'pending';
                    permit.status = 'submitted';
                    await notificationService.notifyPermitPendingApproval(permit, nextStep.approver);
                } else {
                    permit.status = 'active';
                    permit.approvedAt = new Date();
                    const expiryHours = ptwConfig.default?.defaultExpiryHours || 8;
                    permit.expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000);

                    await notificationService.notifyPermitApproved(permit);
                }
            } else {
                permit.status = 'rejected';
                await notificationService.notifyPermitRejected(permit, comments);
            }

            await permit.save();
            res.json({ message: `Permit ${decision}d successfully`, permit });
        } catch (err) {
            console.error('Error approving permit:', err);
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
            const { closureData } = req.body;
            const permit = await Permit.findById(id);

            const authorizedToClose = permit.requestedBy.toString() === req.user._id.toString();
            if (!authorizedToClose) return res.status(403).json({ message: 'Not authorized to close permit' });

            permit.status = 'closed';
            permit.closure = {
                ...closureData,
                approvedBy: new mongoose.Types.ObjectId(req.user._id),
                submittedBy: new mongoose.Types.ObjectId(req.user._id),
                approvedAt: new Date(),
                submittedAt: new Date()
            };

            await permit.save();
            await notificationService.notifyPermitClosed(permit);

            res.json({ message: 'Permit closed successfully', permit });
        } catch (err) {
            console.error('Error closing permit:', err);
            res.status(500).json({ message: err.message });
        }
    }
);

/**
 * STOP permit
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

            const authorizedToStop = permit.stopWorkRoles.some(
                role => role.userId && String(role.userId) === String(req.user._id)
            );
            if (!authorizedToStop) return res.status(403).json({ message: 'Not authorized to stop permit' });

            permit.status = 'stopped';
            permit.stopDetails = {
                ...stopData,
                stoppedBy: new mongoose.Types.ObjectId(req.user._id),
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
            const { extensionHours, comments } = req.body;
            const permit = await Permit.findById(id);
            const company = await Company.findById(companyId);
            const ptwConfig = company.config?.ptw;

            const allowed = ptwConfig.extensionFlow.some(flow => flow.role === req.user.role);
            if (!allowed) return res.status(403).json({ message: 'Not authorized for extension' });

            permit.expiresAt = new Date(permit.expiresAt.getTime() + extensionHours * 3600 * 1000);
            permit.status = 'extension-pending';

            await permit.save();
            await notificationService.notifyPermitExtended(permit, comments);

            res.json({ message: 'Permit extension approved', permit });
        } catch (err) {
            console.error('Error extending permit:', err);
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
            if (denyIfNoFilter(filter, res)) return;

            const permit = await Permit.findOne(filter);
            if (!permit) return res.status(404).json({ message: 'Permit not found' });

            if (permit.status !== 'approved') {
                return res.status(400).json({ message: 'Permit must be approved before activation' });
            }
            if (String(permit.requestedBy) !== String(req.user._id)) {
                return res.status(403).json({ message: 'You are not authorized to activate this permit.' });
            }

            permit.status = 'active';
            permit.activatedAt = new Date();
            permit.activatedBy = new mongoose.Types.ObjectId(req.user._id);

            await permit.save();

            if (permit.schedule?.endDate) {
                try {
                    await reminderService.schedulePermitExpiryReminder(permit);
                } catch (rerr) {
                    console.warn('Failed to (re)schedule permit expiry reminder during activation:', rerr);
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
 * GET dashboard stats
 */
router.get('/:companyId/stats/dashboard',
    validateCompanyId,
    authenticate,
    checkCompanyAccess,
    async (req, res) => {
        try {
            const { companyId } = req.params;

            const baseFilter = buildPermitFilterForRole(req.user, companyId);
            if (denyIfNoFilter(baseFilter, res)) return;

            const [total, active, expired, pending, recentPermits, monthlyData] = await Promise.all([
                Permit.countDocuments(baseFilter),
                Permit.countDocuments({ ...baseFilter, status: 'active' }),
                Permit.countDocuments({ ...baseFilter, status: 'expired' }),
                Permit.countDocuments({ ...baseFilter, status: { $in: ['submitted', 'pending-hod', 'pending-safety-incharge', 'pending-plant-head'] } }),
                Permit.find(baseFilter)
                    .populate('requestedBy', 'name')
                    .populate('plantId', 'name')
                    .sort({ createdAt: -1 })
                    .limit(5),
                Permit.aggregate([
                    { $match: baseFilter },
                    { $group: { _id: '$plantId', count: { $sum: 1 } } },
                    { $sort: { _id: 1 } }
                ])
            ]);

            res.json({
                stats: { total, active, expired, pending, recentPermits, monthlyData }
            });
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            res.status(500).json({ message: err.message });
        }
    }
);

export default router;
