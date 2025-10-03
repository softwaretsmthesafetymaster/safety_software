import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Save, ArrowLeft, Image, Target } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { createHAZOPNode, fetchHAZOPById } from '../../store/slices/hazopSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface NodeFormData {
  nodeNumber: string;
  description: string;
  intention: string;
  equipment: string[];
  operatingConditions: string;
  drawingReference: string;
}

const HAZOPNodeForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const { user } = useAppSelector((state) => state.auth);
  const { currentStudy, isLoading } = useAppSelector((state) => state.hazop);
  const [equipmentInput, setEquipmentInput] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<NodeFormData>({
    defaultValues: {
      equipment: [],
      nodeNumber: ''
    }
  });

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchHAZOPById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  useEffect(() => {
    if (currentStudy) {
      const nextNodeNumber = `N${(currentStudy.nodes?.length || 0) + 1}`.padStart(3, '0');
      setValue('nodeNumber', nextNodeNumber);
    }
  }, [currentStudy, setValue]);

  const equipment = watch('equipment') || [];

  const addEquipment = () => {
    if (equipmentInput.trim()) {
      setValue('equipment', [...equipment, equipmentInput.trim()]);
      setEquipmentInput('');
    }
  };

  const removeEquipment = (index: number) => {
    setValue('equipment', equipment.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: NodeFormData) => {
    if (!user?.companyId || !id) return;

    try {
      await dispatch(createHAZOPNode({
        companyId: user.companyId,
        studyId: id,
        nodeData: data
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Node created successfully'
      }));

      navigate(`/hazop/studies/${id}/worksheet?node=${data.nodeNumber}`);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to create node'
      }));
    }
  };

  const availableDrawings = currentStudy?.process?.drawings || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate(`/hazop/studies/${id}`)}
          >
            Back to Study
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Node
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Add a new node to {currentStudy?.title}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nodeNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Node Number *
                  </label>
                  <input
                    {...register('nodeNumber', { required: 'Node number is required' })}
                    type="text"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="e.g., N001"
                  />
                  {errors.nodeNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nodeNumber.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="drawingReference" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Drawing Reference
                  </label>
                  <select
                    {...register('drawingReference')}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Drawing</option>
                    {availableDrawings.map((drawing, index) => (
                      <option key={index} value={drawing.name}>
                        {drawing.name} ({drawing.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Node Description *
                </label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Describe the node and its components..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
                )}
              </div>

              <div className="mt-6">
                <label htmlFor="intention" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Design Intention *
                </label>
                <textarea
                  {...register('intention', { required: 'Design intention is required' })}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="What is the intended function of this node..."
                />
                {errors.intention && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.intention.message}</p>
                )}
              </div>

              <div className="mt-6">
                <label htmlFor="operatingConditions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Operating Conditions
                </label>
                <textarea
                  {...register('operatingConditions')}
                  rows={2}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Normal operating conditions for this node..."
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Equipment List
                </label>
                <div className="flex space-x-2 mb-3">
                  <input
                    type="text"
                    value={equipmentInput}
                    onChange={(e) => setEquipmentInput(e.target.value)}
                    className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Add equipment (e.g., Pump P-101)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addEquipment}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {equipment.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeEquipment(index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(`/hazop/studies/${id}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={Save}
                  loading={isLoading}
                >
                  Create Node
                </Button>
              </div>
            </Card>
          </form>
        </div>

        {/* Existing Nodes Section */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Existing Nodes
            </h2>
            {currentStudy?.nodes?.length ? (
              <ul className="space-y-3">
                {currentStudy.nodes.map((node) => (
                  <li key={node._id} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                    <Link
                      to={`/hazop/studies/${id}/worksheet?node=${node.nodeNumber}`}
                      className="block hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {node.nodeNumber}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {node.drawingReference}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">
                        {node.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No nodes have been created for this study yet.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HAZOPNodeForm;