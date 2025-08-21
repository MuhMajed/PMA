import React, { useState, useEffect } from 'react';
import { Subcontractor } from '../types';
import { NATIONALITIES } from '../constants';
import Modal from './ui/Modal';

interface AddSubcontractorModalProps {
    onClose: () => void;
    onAdd: (sub: Omit<Subcontractor, 'id'>) => void;
    onEdit: (sub: Subcontractor) => void;
    subcontractorToEdit: Subcontractor | null;
    allSubcontractors: Subcontractor[];
    scopes: string[];
}

const AddSubcontractorModal: React.FC<AddSubcontractorModalProps> = ({
    onClose, onAdd, onEdit, subcontractorToEdit, allSubcontractors, scopes
}) => {
    const [name, setName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');
    const [nationality, setNationality] = useState(NATIONALITIES[0] || '');
    const [scope, setScope] = useState('');
    const [mainContractorId, setMainContractorId] = useState<string | null>(null);

    const isEditMode = !!subcontractorToEdit;

    useEffect(() => {
        if (isEditMode) {
            setName(subcontractorToEdit.name);
            setContactPerson(subcontractorToEdit.contactPerson);
            setEmail(subcontractorToEdit.email);
            setWebsite(subcontractorToEdit.website);
            setNationality(subcontractorToEdit.nationality);
            setScope(subcontractorToEdit.scope);
            setMainContractorId(subcontractorToEdit.mainContractorId || null);
        }
    }, [subcontractorToEdit, isEditMode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !scope || !nationality) {
            alert('Please fill all mandatory fields');
            return;
        }

        const subData = { name, contactPerson, email, website, nationality, scope, mainContractorId };

        if (isEditMode) {
            onEdit({ ...subData, id: subcontractorToEdit.id });
        } else {
            onAdd(subData);
        }
        onClose();
    };

    const inputStyles = "mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";
    const labelStyles = "block text-sm font-medium text-slate-700 dark:text-slate-300";
    const RequiredIndicator = () => <span className="text-red-500 ml-1">*</span>;

    const availableMainContractors = allSubcontractors.filter(s => s.id !== subcontractorToEdit?.id);

    return (
        <Modal title={isEditMode ? 'Edit Subcontractor' : 'Add New Subcontractor'} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label htmlFor="subName" className={labelStyles}>Company Name<RequiredIndicator /></label>
                        <input type="text" id="subName" value={name} onChange={(e) => setName(e.target.value)} required className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="mainContractor" className={labelStyles}>Main Contractor (Optional)</label>
                        <select 
                            id="mainContractor" 
                            value={mainContractorId || ''} 
                            onChange={(e) => setMainContractorId(e.target.value || null)} 
                            className={inputStyles}
                        >
                            <option value="">None (Is a Main Contractor)</option>
                            {availableMainContractors.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="contactPerson" className={labelStyles}>Contact Person</label>
                            <input type="text" id="contactPerson" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={inputStyles} />
                        </div>
                        <div>
                            <label htmlFor="email" className={labelStyles}>Email</label>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyles} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="website" className={labelStyles}>Website</label>
                            <input type="text" id="website" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputStyles} />
                        </div>
                        <div>
                            <label htmlFor="subNationality" className={labelStyles}>Nationality<RequiredIndicator /></label>
                            <select id="subNationality" value={nationality} onChange={(e) => setNationality(e.target.value)} required className={inputStyles}>
                                {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="scope" className={labelStyles}>Scope of Work<RequiredIndicator /></label>
                        <input list="scopes" id="scope" value={scope} onChange={(e) => setScope(e.target.value)} required className={inputStyles} />
                        <datalist id="scopes">
                            {scopes.map(s => <option key={s} value={s} />)}
                        </datalist>
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 text-right space-x-3">
                    <button type="button" onClick={onClose} className="inline-flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                        Cancel
                    </button>
                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700">
                        {isEditMode ? 'Save Changes' : 'Add Subcontractor'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddSubcontractorModal;
