import { DynamicFieldsManager } from '../DynamicFieldsManager';

export function SettingsView() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      <DynamicFieldsManager />
    </div>
  );
}