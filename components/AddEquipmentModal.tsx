import React, { useState, useEffect } from 'react';
import { Equipment, Employee } from '../types';
import Modal from './ui/Modal';
import { useMessage } from './ConfirmationProvider';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface AddEquipmentModalProps {
  onClose: () => void;
  onAdd: (equipment: Omit<Equipment, 'id'>) => void;
  onEdit: (equipment: Equipment) => void;
  equipmentToEdit: Equipment | null;
  allEquipment: Equipment[];
  employees: Employee[];
}

const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({ 
    onClose, onAdd, onEdit, equipmentToEdit, allEquipment, employees 
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [plateNo, setPlateNo] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [status, setStatus] = useState<'Active' | 'Under Maintenance' | 'Inactive'>('Active');
  const [operatorStatus, setOperatorStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const { showError } = useMessage();

  const isEditMode = !!equipmentToEdit;

  useEffect(() => {
    if (isEditMode) {
      setName(equipmentToEdit.name);
      setType(equipmentToEdit.type);
      setPlateNo(equipmentToEdit.plateNo);
      setOperatorId(equipmentToEdit.operatorId);
      setStatus(equipmentToEdit.status);
      handleFindOperator(equipmentToEdit.operatorId, true);
    }
  }, [equipmentToEdit, isEditMode, employees]);

  const handleFindOperator = (searchId: string, isInitialLoad = false) => {
    if (!searchId) {
      setOperatorStatus('idle');
      setOperatorName('');
      return;
    }
    const employee = employees.find(e => e.empId.toLowerCase() === searchId.toLowerCase());
    if (employee) {
      setOperatorStatus('valid');
      setOperatorName(employee.name);
    } else {
      setOperatorStatus('invalid');
      setOperatorName('');
      if (!isInitialLoad) {
        showError('Operator Not Found', 'No employee found with this ID.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !type || !plateNo || !operatorId || !status) {
      showError('Missing Information', 'Please fill all mandatory fields.');
      return;
    }

    if (operatorStatus !== 'valid') {
      showError('Invalid Operator', 'Please assign a valid employee as the operator.');
      return;
    }

    const plateNoExists = allEquipment.some(
      eq => eq.plateNo.toLowerCase() === plateNo.toLowerCase() && eq.id !== equipmentToEdit?.id
    );
    if (plateNoExists) {
      showError('Duplicate Plate No.', 'An equipment with this Plate No. already exists.');
      return;
    }

    const equipmentData = { name, type, plateNo, operatorId, status };

    if (isEditMode) {
      onEdit({ ...equipmentData, id: equipmentToEdit.id });
    } else {
      onAdd(equipmentData);
    }
    onClose();
  };

  const inputStyles = "mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";
  const labelStyles = "block text-sm font-medium text-slate-700 dark:text-slate-300";
  const RequiredIndicator = () => <span className="text-red-500 ml-1">*</span>;

  return (
    <Modal title={isEditMode ? 'Edit Equipment' : 'Add New Equipment'} onClose={onClose} size="3xl">
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className={labelStyles}>Equipment Name<RequiredIndicator /></label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className={inputStyles} />
            </div>
            <div>
              <label htmlFor="type" className={labelStyles}>Type<RequiredIndicator /></label>
              <input type="text" id="type" value={type} onChange={e => setType(e.target.value)} required className={inputStyles} placeholder="e.g., Excavator, Truck, Crane" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="plateNo" className={labelStyles}>Plate No. / Serial<RequiredIndicator /></label>
              <input type="text" id="plateNo" value={plateNo} onChange={e => setPlateNo(e.target.value)} required className={inputStyles} />
            </div>
            <div>
              <label htmlFor="status" className={labelStyles}>Status<RequiredIndicator /></label>
              <select id="status" value={status} onChange={e => setStatus(e.target.value as any)} required className={inputStyles}>
                <option value="Active">Active</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <hr className="border-slate-200 dark:border-slate-700" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="operatorId" className={labelStyles}>Default Operator ID<RequiredIndicator /></label>
              <div className="relative">
                <input
                  type="text"
                  id="operatorId"
                  value={operatorId}
                  onChange={e => setOperatorId(e.target.value)}
                  onBlur={e => handleFindOperator(e.target.value)}
                  required
                  className={`${inputStyles} pr-10`}
                />
                <div className="absolute inset-y-0 right-0 top-0 pr-3 flex items-center pointer-events-none">
                  {operatorStatus === 'valid' && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                  {operatorStatus === 'invalid' && <XCircleIcon className="h-5 w-5 text-red-500" />}
                </div>
              </div>
            </div>
            <div>
              <label className={labelStyles}>Operator Name</label>
              <input type="text" value={operatorName} readOnly className={`${inputStyles} bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 text-right space-x-3">
          <button type="button" onClick={onClose} className="inline-flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
            Cancel
          </button>
          <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700">
            {isEditMode ? 'Save Changes' : 'Add Equipment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEquipmentModal;