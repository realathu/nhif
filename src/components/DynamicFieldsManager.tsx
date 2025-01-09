import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config';
import { auth } from '../services/auth';

type DynamicFieldsManagerProps = {
  defaultFieldName?: string;
};

export function DynamicFieldsManager({ defaultFieldName = '' }: DynamicFieldsManagerProps) {
  const [fieldName, setFieldName] = useState(defaultFieldName);
  const [fieldValue, setFieldValue] = useState("");
  const [existingValues, setExistingValues] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (defaultFieldName) {
      setFieldName(defaultFieldName);
      fetchExistingValues(defaultFieldName);
    }
  }, [defaultFieldName]);

  const fetchExistingValues = async (name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const token = auth.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_ENDPOINTS.dynamicFields}/${name}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch values');
      }

      const values = await response.json();
      setExistingValues(values);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch values');
      console.error('Failed to fetch values:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName || !fieldValue) {
      setError("Both field name and value are required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      const token = auth.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(API_ENDPOINTS.dynamicFields, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fieldName, fieldValue })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add field value');
      }

      setFieldValue("");
      setSuccessMessage("Value added successfully");
      // Add the new value to the existing values
      setExistingValues([...existingValues, fieldValue].sort());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add field value');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (value: string) => {
    if (!confirm('Are you sure you want to delete this value?')) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      const token = auth.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(API_ENDPOINTS.dynamicFields, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fieldName, fieldValue: value })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete field value');
      }

      setSuccessMessage("Value deleted successfully");
      setExistingValues(existingValues.filter(v => v !== value));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete field value');
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmissionDate = fieldName === 'admission_date';

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!defaultFieldName && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Field Name</label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g., course_name, admission_date"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {isAdmissionDate ? 'New Admission Date' : 'New Value'}
          </label>
          {isAdmissionDate ? (
            <input
              type="date"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          ) : (
            <input
              type="text"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Enter new value"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white ${
            isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {isSubmitting ? 'Adding...' : 'Add Value'}
        </button>
      </form>

      {isLoading ? (
        <div className="text-center py-4">Loading...</div>
      ) : existingValues.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Existing Values:</h3>
          <div className="border rounded-md divide-y">
            {existingValues.map((value, index) => (
              <div key={index} className="flex items-center justify-between p-3">
                <span className="text-gray-900">
                  {isAdmissionDate ? new Date(value).toLocaleDateString() : value}
                </span>
                <button
                  onClick={() => handleDelete(value)}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}