import { useState, useEffect } from 'react';
import { DownloadSimple, Eye, Export } from '@phosphor-icons/react';
import { 
  Student, 
  fetchStudents, 
  exportSelectedStudents, 
  exportNewStudents,
  fetchStudentStats, 
  StudentStats 
} from '../../services/students';

export function StudentsView() {
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'exported' | 'pending'>('all');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [studentsData, statsData] = await Promise.all([
        fetchStudents(),
        fetchStudentStats()
      ]);
      
      setStudents(studentsData);
      setStats(statsData);
      setSelectedStudents([]); // Reset selections on data refresh
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportSelected = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select students to export');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await exportSelectedStudents(selectedStudents);
      await loadData(); // Refresh data after export
      
      alert(`Successfully exported ${selectedStudents.length} students`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to export students');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportNew = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await exportNewStudents();
      await loadData(); // Refresh data after export
    } catch (error) {
      if (error instanceof Error && error.message === 'No new students to export') {
        alert('No new students to export');
      } else {
        setError(error instanceof Error ? error.message : 'Failed to export new students');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const toggleSelectStudent = (id: number) => {
    setSelectedStudents(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  // Filter students based on search term and filter
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admission_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.form_four_index_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filter === 'all' || 
      (filter === 'exported' && student.is_exported) ||
      (filter === 'pending' && !student.is_exported);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900">Total Students</h3>
            <p className="mt-2 text-3xl font-semibold">{stats.total}</p>
            <div className="mt-4 flex gap-4">
              <div>
                <span className="text-sm text-gray-500">Exported</span>
                <p className="text-xl font-medium text-green-600">{stats.exported}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Pending</span>
                <p className="text-xl font-medium text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900">By Gender</h3>
            <div className="mt-4 space-y-2">
              {stats.byGender.map(({ gender, count }) => (
                <div key={gender} className="flex justify-between">
                  <span className="text-gray-500">{gender}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900">By Course</h3>
            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              {stats.byCourse.map(({ course_name, count }) => (
                <div key={course_name} className="flex justify-between">
                  <span className="text-gray-500">{course_name}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={handleExportSelected}
                disabled={isLoading || selectedStudents.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                <Export size={20} />
                <span>Export Selected ({selectedStudents.length})</span>
              </button>

              <button
                onClick={handleExportNew}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <DownloadSimple size={20} />
                <span>Export New</span>
              </button>
            </div>

            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">All Students</option>
                <option value="exported">Exported</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === filteredStudents.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleSelectStudent(student.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.first_name} {student.middle_name} {student.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.admission_no}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.course_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.is_exported 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {student.is_exported ? 'Exported' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Student Details</h2>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-500">Personal Information</h3>
                    <p><span className="font-medium">Name:</span> {selectedStudent.first_name} {selectedStudent.middle_name} {selectedStudent.last_name}</p>
                    <p><span className="font-medium">Email:</span> {selectedStudent.email}</p>
                    <p><span className="font-medium">Date of Birth:</span> {selectedStudent.date_of_birth}</p>
                    <p><span className="font-medium">Gender:</span> {selectedStudent.gender}</p>
                    <p><span className="font-medium">Marital Status:</span> {selectedStudent.marital_status}</p>
                    <p><span className="font-medium">Mobile:</span> {selectedStudent.mobile_no}</p>
                    <p><span className="font-medium">National ID:</span> {selectedStudent.national_id}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-500">Academic Information</h3>
                    <p><span className="font-medium">Form Four Index:</span> {selectedStudent.form_four_index_no}</p>
                    <p><span className="font-medium">Admission No:</span> {selectedStudent.admission_no}</p>
                    <p><span className="font-medium">Course:</span> {selectedStudent.course_name}</p>
                    <p><span className="font-medium">Year of Study:</span> {selectedStudent.year_of_study}</p>
                    <p><span className="font-medium">Course Duration:</span> {selectedStudent.course_duration} year(s)</p>
                    <p><span className="font-medium">Admission Date:</span> {selectedStudent.admission_date}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-500">Status Information</h3>
                  <p><span className="font-medium">Export Status:</span> {selectedStudent.is_exported ? 'Exported' : 'Pending'}</p>
                  {selectedStudent.exported_at && (
                    <p><span className="font-medium">Exported Date:</span> {new Date(selectedStudent.exported_at).toLocaleString()}</p>
                  )}
                  <p><span className="font-medium">Record Created:</span> {new Date(selectedStudent.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}