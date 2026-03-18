'use client';

import { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  value: string | number;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string | number | null;
  onChange: (value: any) => void;
  options: DropdownOption[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  label,
  placeholder = 'Chọn một mục...',
  disabled = false,
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`input-field flex items-center justify-between text-left ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        } ${isOpen ? 'border-[var(--primary)] ring-2 ring-[color-mix(in_srgb,var(--primary)_15%,transparent)]' : ''}`}
        disabled={disabled}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : <span className="text-[var(--muted-light)]">{placeholder}</span>}
        </span>
        <svg
          className={`h-4 w-4 text-[var(--muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-[100] mt-2 w-full min-w-[200px] overflow-hidden rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] p-1 shadow-lg animate-fade-in backdrop-blur-md">
          <div className="max-h-[300px] overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[var(--muted)] italic">
                Không có lựa chọn nào
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  disabled={option.disabled}
                  className={`flex w-full flex-col px-4 py-2.5 text-left transition-colors duration-150 rounded-lg ${
                    option.value === value
                      ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                      : 'text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                  } ${option.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                >
                  <span className="text-sm">{option.label}</span>
                  {option.sublabel && (
                    <span className={`text-[10px] ${option.value === value ? 'text-[var(--primary)] opacity-80' : 'text-[var(--muted)]'}`}>
                      {option.sublabel}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
