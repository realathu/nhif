import React, { useState, useEffect } from 'react';
import { Users, Files, ChartBar } from '@phosphor-icons/react';
import { fetchStudentStats, StudentStats } from '../../services/students';

export function DashboardView() {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchStudentStats();
      setStats(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load statistics');
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users size={32} className="text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Exported</p>
              <p className="text-2xl font-bold text-green-600">{stats.exported}</p>
            </div>
            <Files size={32} className="text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <ChartBar size={32} className="text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Distribution Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Gender Distribution</h3>
          <div className="space-y-2">
            {stats.byGender.map(({ gender, count }) => (
              <div key={gender} className="flex justify-between items-center">
                <span className="text-gray-600">{gender}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Course Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Course Distribution</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.byCourse.map(({ course_name, count }) => (
              <div key={course_name} className="flex justify-between items-center">
                <span className="text-gray-600">{course_name}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}