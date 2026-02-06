import React from 'react';
import { Input } from './ui/input';

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
    <Input
      type="number"
      value={value}
      onChange={handleChange}
      className={className}
      {...props}
    />
  );
}
