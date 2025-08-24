
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronUpDownIcon } from '../icons/ChevronUpDownIcon';

interface SearchableSelectProps {
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = 'Select...', disabled = false, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOption = useMemo(() => options.find(opt => opt.value === value), [options, value]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [options, searchTerm]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setSearchTerm('');
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    useEffect(() => {
        // When the value is cleared externally (e.g., parent filter changes), close the dropdown.
        if (!value) {
            setIsOpen(false);
        }
    }, [value]);

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left focus:outline-none focus:ring-1 focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
            >
                <span className={`block truncate ${selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {selectedOption?.label || placeholder}
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronUpDownIcon className="h-5 w-5 text-slate-400" />
                </span>
            </button>

            {isOpen && !disabled && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 shadow-lg rounded-md border border-slate-300 dark:border-slate-600">
                    <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-2 py-1 text-sm border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600"
                            autoFocus
                        />
                    </div>
                    <ul className="max-h-60 overflow-y-auto p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <li
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={`px-3 py-2 text-sm rounded-md cursor-pointer ${
                                        value === option.value
                                            ? 'bg-[#28a745] text-white'
                                            : 'text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {option.label}
                                </li>
                            ))
                        ) : (
                            <li className="px-3 py-2 text-sm text-slate-500">No options found.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
