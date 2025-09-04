import React from 'react';
import { Label } from './Label';

export interface FormFieldProps {
  /**
   * Label text for the field
   */
  label: string;

  /**
   * The input element (NumberInput, regular input, select, etc.)
   */
  children: React.ReactElement;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Error message to display below the input
   */
  error?: string;

  /**
   * Helper text to display below the input
   */
  helperText?: string;
}

export function FormField({
  label,
  children,
  required = false,
  className = '',
  error,
  helperText,
}: FormFieldProps) {
  const fieldId = React.useId();

  // Clone the child element and add the id for accessibility
  const childWithId = React.cloneElement(children, {
    id: fieldId,
    'aria-describedby': error
      ? `${fieldId}-error`
      : helperText
      ? `${fieldId}-helper`
      : undefined,
    'aria-invalid': error ? 'true' : undefined,
  });

  return (
    <div className={className}>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      {childWithId}
      {error && (
        <p id={`${fieldId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${fieldId}-helper`} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
