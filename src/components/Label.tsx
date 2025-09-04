import React from 'react';

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * The label text content
   */
  children: React.ReactNode;

  /**
   * Whether this is an inline label (for checkboxes, radio buttons, etc.)
   * If true, uses inline-flex layout with proper spacing
   * If false (default), uses block layout suitable for form fields
   */
  inline?: boolean;

  /**
   * Whether the label is required (adds visual indicator)
   */
  required?: boolean;

  /**
   * Additional CSS classes to apply
   */
  className?: string;

  /**
   * Size variant of the label
   */
  size?: 'sm' | 'base' | 'lg';
}

export function Label({
  children,
  inline = false,
  required = false,
  className = '',
  size = 'sm',
  ...props
}: LabelProps) {
  const baseClasses = 'font-medium text-gray-700';

  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  };

  const layoutClasses = inline ? 'inline-flex items-center' : 'block mb-1';

  const combinedClasses = [
    baseClasses,
    sizeClasses[size],
    layoutClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={combinedClasses} {...props}>
      {inline ? (
        <>
          {/* For inline labels, children should include the input element */}
          {children}
        </>
      ) : (
        <>
          {children}
          {required && <span className="text-red-500 ml-1">*</span>}
        </>
      )}
    </label>
  );
}

/**
 * A specialized label component for checkbox/radio inputs
 * Handles the inline layout with proper spacing automatically
 */
export interface CheckboxLabelProps
  extends Omit<LabelProps, 'inline' | 'children'> {
  /**
   * The checkbox or radio input element
   */
  input: React.ReactElement;

  /**
   * The label text
   */
  children: React.ReactNode;
}

export function CheckboxLabel({
  input,
  children,
  className = '',
  size = 'sm',
  ...props
}: CheckboxLabelProps) {
  const textClasses = `ml-2 font-medium text-gray-700 ${
    size === 'sm' ? 'text-sm' : size === 'base' ? 'text-base' : 'text-lg'
  }`;

  return (
    <Label
      inline
      className={`inline-flex items-center ${className}`}
      {...props}
    >
      {React.cloneElement(input)}
      <span className={textClasses}>{children}</span>
    </Label>
  );
}
