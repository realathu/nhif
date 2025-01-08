import * as React from "react";

type DynamicSelectProps = {
  fieldName: string;
  value: string;
  onChange: (value: string) => void;
};

export function DynamicSelect({ fieldName, value, onChange }: DynamicSelectProps) {
  const [options, setOptions] = React.useState<string[]>([]);

  React.useEffect(() => {
    fetch(`/api/dynamic-fields/${fieldName}`)
      .then(res => res.json())
      .then(data => setOptions(data))
      .catch(console.error);
  }, [fieldName]);

  return (
    <listPicker
      className="p-3 bg-white rounded border border-gray-300"
      items={options}
      selectedIndex={options.indexOf(value)}
      onSelectedIndexChange={(e) => {
        const newValue = options[e.value];
        if (newValue) {
          onChange(newValue);
        }
      }}
    />
  );
}