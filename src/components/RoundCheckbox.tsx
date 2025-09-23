import { Check } from 'lucide-react';

export interface RoundCheckboxProps {
  checked: boolean;
  onChange: () => void;
  title?: string;
  className?: string;
  disabled?: boolean;
}

export function RoundCheckbox({
  checked,
  onChange,
  title,
  className = '',
  disabled = false,
}: RoundCheckboxProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      title={title}
      className={`
        w-5 h-5 rounded-full border transition-all duration-150 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        ${
          checked
            ? 'bg-gray-600 border-gray-600'
            : 'bg-white border-gray-300 hover:border-gray-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {checked && (
        // <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto" />
        <Check className="w-3 h-3 text-white mx-auto" />
      )}
    </button>
  );
}
