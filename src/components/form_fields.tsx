import type { InputHTMLAttributes } from 'react';

import { humanize } from '../utils/incident_options';
import type { Option } from '../utils/incident_options';

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function TextField({ label, value, onChange, className, ...rest }: TextFieldProps) {
  return (
    <label className={className}>
      {label}
      <input {...rest} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export function SelectField({ label, value, onChange, options, placeholder, required, disabled, className }: SelectFieldProps) {
  // Keep a value the API returned even if it isn't in our option list.
  const list = value && !options.some((option) => option.value === value) ? [{ value, label: humanize(value) }, ...options] : options;
  return (
    <label className={className}>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} required={required} disabled={disabled}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {list.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
  placeholder?: string;
  className?: string;
};

export function TextAreaField({ label, value, onChange, rows = 4, required, placeholder, className }: TextAreaFieldProps) {
  return (
    <label className={className}>
      {label}
      <textarea className="ops-textarea" rows={rows} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} />
    </label>
  );
}