import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface DbGainInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  title?: string;
  disabled?: boolean;
  withSlider?: boolean;
}

export function DbGainInput({
  value,
  onChange,
  min = -60,
  max = 40,
  className = '',
  title,
  disabled = false,
  withSlider = false,
}: DbGainInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const clampValue = (val: number) => Math.max(min, Math.min(max, val));
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartValue(value);
    document.body.style.cursor = 'ns-resize';
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = dragStartY - e.clientY;
      const deltaValue = deltaY * 0.1;
      const newValue = clampValue(dragStartValue + deltaValue);
      onChange(newValue);
    },
    [isDragging, dragStartY, dragStartValue, onChange, clampValue],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTextClick = () => {
    setIsEditing(true);
    setInputValue(value.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitValue();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(value.toString());
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = clampValue(value + 0.5);
      onChange(newValue);
      setInputValue(newValue.toString());
      ``;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = clampValue(value - 0.5);
      onChange(newValue);
      setInputValue(newValue.toString());
    }
  };

  const handleInputBlur = () => {
    commitValue();
  };

  const commitValue = () => {
    const parsedValue = parseFloat(inputValue);
    if (!isNaN(parsedValue)) {
      onChange(clampValue(parsedValue));
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(value.toString());
    }
  }, [value, isEditing]);

  const getSliderBackground = () => {
    const percentage = ((value - min) / (max - min)) * 100;
    const zeroPercentage = ((0 - min) / (max - min)) * 100;

    if (value >= 0) {
      return `linear-gradient(to right,
        var(--color-gray-200) 0%,
        var(--color-gray-200) ${zeroPercentage}%,
        var(--color-gray-800) ${zeroPercentage}%,
        var(--color-gray-800) ${percentage}%,
        var(--color-gray-200) ${percentage}%,
        var(--color-gray-200) 100%)`;
    } else {
      return `linear-gradient(to right,
        var(--color-gray-200) 0%,
        var(--color-gray-200) ${percentage}%,
        var(--color-gray-800) ${percentage}%,
        var(--color-gray-800) ${zeroPercentage}%,
        var(--color-gray-200) ${zeroPercentage}%,
        var(--color-gray-200) 100%)`;
    }
  };

  const zeroPercentage = ((0 - min) / (max - min)) * 100;

  return (
    <div className={`flex flex-col gap-1 ${className}`} title={title}>
      <div className="flex items-center gap-2">
        {withSlider && (
          <div className="flex-1 relative" onMouseDown={handleMouseDown}>
            <div
              className="w-full h-3 rounded-lg"
              style={{
                background: getSliderBackground(),
              }}
            ></div>
            <div
              className="absolute top-0 w-[2px] h-3 bg-white pointer-events-none"
              style={{
                left: `${zeroPercentage}%`,
                transform: 'translateX(-50%)',
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-1">
          {isEditing ? (
            <input
              disabled={disabled}
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              className="w-12 px-1 py-0.5 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <button
              disabled={disabled}
              onClick={handleTextClick}
              onMouseDown={handleMouseDown}
              className={`w-12 px-1 py-0.5 text-xs border rounded text-right select-none cursor-ns-resize ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 focus:outline-none focus:border-blue-500'
              }`}
            >
              {value.toFixed(1)}
            </button>
          )}
          <span className="text-xs text-gray-500 w-6">dB</span>
        </div>
      </div>
    </div>
  );
}
