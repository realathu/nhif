import React from 'react';
import { DynamicFieldsManager } from '../DynamicFieldsManager';

export function SettingsView() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Course Names Management</h2>
        <DynamicFieldsManager defaultFieldName="course_name" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Admission Dates Management</h2>
        <p className="text-sm text-gray-600 mb-4">
          Add admission dates in YYYY-MM-DD format (e.g., 2024-01-15)
        </p>
        <DynamicFieldsManager defaultFieldName="admission_date" />
      </div>
    </div>
  );
}