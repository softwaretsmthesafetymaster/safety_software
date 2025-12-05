import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save,CheckCheckIcon, PlusCircle, XCircle, CheckCheck } from 'lucide-react'; // Importing icons
import toast from 'react-hot-toast'; // For toast notifications
const PERMIT_TYPES = {
  electrical: 'Electrical Work',
  lifting: 'Lifting Operations',
  workAtHeight: 'Work at Height',
  confinedSpace: 'Confined Space',
  fire: 'Fire Work',
  environmental: 'Environmental',
  hotWork: 'Hot Work',
  coldWork: 'Cold Work',
  excavation: 'Excavation',
  demolition: 'Demolition',
  chemical: 'Chemical Work',
  radiation: 'Radiation Work'
};

const CATEGORIES = [
  { key: 'riskAssociated', label: 'Risk Associated' },
  { key: 'precautions', label: 'Precautions' },
  { key: 'ppeRequired', label: 'PPE Required' },
  { key: 'inspectionChecklist', label: 'Inspection Checklist' },
  { key: 'rescueTechniques', label: 'Rescue Techniques' }
];
const API_URL= import.meta.env.VITE_API_URL
const ChecklistManager = () => {
  const [permitType, setPermitType] = useState('');
  const [checklist, setChecklist] = useState({
    riskAssociated: [''],
    precautions: [''],
    ppeRequired: [''],
    inspectionChecklist: [''],
    rescueTechniques: ['']
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const handleInputChange = (category, index, value) => {
    setChecklist((prev) => ({
      ...prev,
      [category]: prev[category].map((item, i) => (i === index ? value : item))
    }));
  };

  const addItem = (category) => {
    setChecklist((prev) => ({
      ...prev,
      [category]: [...prev[category], '']
    }));
  };

  const removeItem = (category, index) => {
    setChecklist((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Filter out empty strings before sending
      const cleanedChecklist = {};
      for (const key in checklist) {
        cleanedChecklist[key] = checklist[key].filter(item => item.trim() !== '');
      }

      await axios.post(`${API_URL}/permit/checklist`, { permitType, ...cleanedChecklist });
      toast.success('Checklist saved successfully!');
    } catch (err) {
      toast.error('Error saving checklist.');
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChecklist = async (type) => {
    setInitialLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/permit/checklist/${type}`);
      if (data.checklist) {
        // Ensure all categories exist and have at least one empty string if array is empty
        const fetchedChecklist = data.checklist;
        const populatedChecklist = {};
        CATEGORIES.forEach(cat => {
          populatedChecklist[cat.key] = fetchedChecklist[cat.key]?.length > 0 ? fetchedChecklist[cat.key] : [''];
        });
        setChecklist(populatedChecklist);
      } else {
        // Reset to initial state with one empty input for each category
        setChecklist({
          riskAssociated: [''],
          precautions: [''],
          ppeRequired: [''],
          inspectionChecklist: [''],
          rescueTechniques: ['']
        });
      }
    } catch (err) {
      toast.error('Failed to load checklist.');
      console.error('Fetch error', err);
      // Even on error, reset to initial state
      setChecklist({
        riskAssociated: [''],
        precautions: [''],
        ppeRequired: [''],
        inspectionChecklist: [''],
        rescueTechniques: ['']
      });
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (permitType) {
      fetchChecklist(permitType);
    } else {
      // If no permit type is selected, reset the checklist and stop loading
      setChecklist({
        riskAssociated: [''],
        precautions: [''],
        ppeRequired: [''],
        inspectionChecklist: [''],
        rescueTechniques: ['']
      });
      setInitialLoading(false);
    }
  }, [permitType]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permit Checklist Manager</h1>
          <p className="text-gray-600">Create and manage checklists for different permit types.</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!permitType || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Checklist'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="flex items-center mb-4">
          <CheckCheck className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Select Permit Type</h2>
        </div>

        <div className="mb-6">
          <label htmlFor="permit-type-select" className="sr-only">Select Permit Type</label>
          <select
            id="permit-type-select"
            value={permitType}
            onChange={(e) => setPermitType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-700"
          >
            <option value="">-- Select Permit Type --</option>
            {Object.entries(PERMIT_TYPES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {initialLoading && permitType ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : permitType && (
          <div className="space-y-8">
            {CATEGORIES.map(({ key, label }) => (
              <div key={key} className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                <h3 className="font-semibold text-blue-700 text-lg mb-3 flex items-center">
                  {label}
                </h3>
                {checklist[key].map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-center mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleInputChange(key, idx, e.target.value)}
                      placeholder={`Enter ${label} item`}
                      className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-300 focus:border-transparent text-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(key, idx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors"
                      title="Remove item"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addItem(key)}
                  className="mt-2 text-blue-600 text-sm font-medium hover:underline flex items-center"
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Add {label}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistManager;