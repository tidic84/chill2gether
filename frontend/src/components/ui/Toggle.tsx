import React from 'react';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, disabled = false }) => {
    return (
        <label className={`flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div className="relative">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => !disabled && onChange(e.target.checked)}
                    disabled={disabled}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
            </div>
            {label && <span className="ml-3 text-sm font-medium text-gray-300">{label}</span>}
        </label>
    );
};

export default Toggle;