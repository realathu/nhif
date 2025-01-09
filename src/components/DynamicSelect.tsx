import * as React from "react";

type DynamicSelectProps = {
  fieldName: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label: string;
};

export function DynamicSelect({ fieldName, value, onChange, error, label }: DynamicSelectProps) {
  const [options, setOptions] = React.useState<string[]>([]);

  React.useEffect(() => {
    fetch(`/api/dynamic-fields/${fieldName}`)
      .then(res => res.json())
      .then(data => setOptions(data))
      .catch(console.error);
  }, [fieldName]);

  return (
    <div className="form-control w-full">
      <label className="label">
        <span className="label-text">{label}</span>
      </label>
      <select
        name={fieldName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`select select-bordered w-full ${error ? 'select-error' : ''}`}
      >
        <option value="">Select {label}</option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && <span className="text-error text-sm mt-1">{error}</span>}
    </div>
  );
}