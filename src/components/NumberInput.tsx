import React from 'react';

export interface NumberInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'onChange' | 'value'
  > {
  /**
   * Current numeric value
   */
  value: number;

  /**
   * Callback when value changes
   */
  onChange: (value: number) => void;

  /**
   * Whether to parse as integer (default) or float
   */
  parseAs?: 'int' | 'float';

  /**
   * Fallback value when input is invalid
   */
  fallback?: number;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function NumberInput({
  value,
  onChange,
  parseAs = 'float',
  fallback = 0,
  className = '',
  ...props
}: NumberInputProps) {
  const baseClasses =
    'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100';
  const combinedClasses = [baseClasses, className].filter(Boolean).join(' ');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      onChange(fallback);
      return;
    }

    const parsedValue =
      parseAs === 'int' ? parseInt(inputValue, 10) : parseFloat(inputValue);

    onChange(isNaN(parsedValue) ? fallback : parsedValue);
  };

  return (
    <input
      type="number"
      value={value}
      onChange={handleChange}
      className={combinedClasses}
      {...props}
    />
  );
}
