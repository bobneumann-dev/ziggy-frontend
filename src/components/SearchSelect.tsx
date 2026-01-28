import Select, { type SingleValue } from 'react-select';

export type SearchSelectOption = {
  value: string | number;
  label: string;
};

type SearchSelectProps = {
  options: SearchSelectOption[];
  value?: SearchSelectOption | null;
  onChange: (option: SearchSelectOption | null) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  hasError?: boolean;
  className?: string;
};

export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  isDisabled,
  isClearable = true,
  isSearchable = true,
  hasError = false,
  className,
}: SearchSelectProps) {
  return (
    <Select
      className={className}
      classNamePrefix="search-select"
      options={options}
      value={value}
      onChange={(option: SingleValue<SearchSelectOption>) => onChange(option ?? null)}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isClearable={isClearable}
      isSearchable={isSearchable}
      styles={{
        container: (base) => ({
          ...base,
          width: '100%',
        }),
        control: (base, state) => ({
          ...base,
          backgroundColor: 'var(--input-bg)',
          borderColor: hasError ? 'var(--accent-danger)' : (state.isFocused ? 'var(--accent-primary)' : 'var(--input-border)'),
          borderRadius: '0.5rem',
          minHeight: '2.5rem',
          boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem',
        }),
        placeholder: (base) => ({
          ...base,
          color: 'var(--text-muted)',
        }),
        singleValue: (base) => ({
          ...base,
          color: 'var(--text-primary)',
        }),
        input: (base) => ({
          ...base,
          color: 'var(--text-primary)',
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-light)',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.18)',
          zIndex: 30,
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected
            ? 'rgba(201, 162, 39, 0.2)'
            : state.isFocused
              ? 'var(--card-bg-hover)'
              : 'transparent',
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }),
        indicatorSeparator: (base) => ({
          ...base,
          backgroundColor: 'var(--border-light)',
        }),
        dropdownIndicator: (base) => ({
          ...base,
          color: 'var(--text-muted)',
        }),
        clearIndicator: (base) => ({
          ...base,
          color: 'var(--text-muted)',
        }),
        multiValue: (base) => ({
          ...base,
          backgroundColor: 'var(--bg-tertiary)',
        }),
        multiValueLabel: (base) => ({
          ...base,
          color: 'var(--text-primary)',
        }),
      }}
    />
  );
}
