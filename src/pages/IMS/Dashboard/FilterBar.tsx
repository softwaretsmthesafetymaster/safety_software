import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, X, Calendar, ChevronDown } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../hooks/redux';
import { setFilters, resetFilters } from '../../../store/slices/incidentSlice';

interface FilterBarProps {
  onFiltersChange: (filters: any) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFiltersChange }) => {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((state) => state.incident);
  const { user } = useAppSelector((state) => state.auth);
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [plants, setPlants] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Fetch plants, areas, users based on user role
    if (user?.role === 'company_owner') {
      // Fetch all plants
      setPlants([
        { _id: '1', name: 'Plant A', code: 'PA' },
        { _id: '2', name: 'Plant B', code: 'PB' },
      ]);
    } else {
      // User's assigned plant only
      setPlants([{ _id: user?.plantId, name: 'Current Plant', code: 'CP' }]);
    }
    
    setAreas([
      { _id: '1', name: 'Production Area', plantId: '1' },
      { _id: '2', name: 'Warehouse', plantId: '1' },
      { _id: '3', name: 'Office', plantId: '2' },
    ]);
    
    setUsers([
      { _id: '1', name: 'John Doe', role: 'safety_officer' },
      { _id: '2', name: 'Jane Smith', role: 'investigator' },
    ]);
  }, [user]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    dispatch(setFilters(newFilters));
    onFiltersChange(newFilters);
  };

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    const newDateRange = { ...filters.dateRange, [type]: value };
    handleFilterChange('dateRange', newDateRange);
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    onFiltersChange({});
  };

  const getActiveFilterCount = ()=>{
    let count = 0;
    if (filters.dateRange?.start) count++;
    if (filters.dateRange?.end) count++;
    if (filters.plants) count++;
    if (filters.areas) count++;
    if (filters.severity) count++;
    if (filters.type) count++;
    if (filters.status) count++;
    if (filters.reporter) count++;
    if (filters.investigator) count++;
    if (filters.search) count++;
    return count;
  }
}
export default FilterBar;