import { getAuthToken, getRole } from './auth';
import { API_ENDPOINTS } from '../config';

export type Student = {
  id: number;
  user_id: number;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  form_four_index_no: string;
  date_of_birth: string;
  marital_status: string;
  gender: string;
  admission_date: string;
  mobile_no: string;
  course_name: string;
  year_of_study: number;
  course_duration: number;
  national_id: string;
  admission_no: string;
  is_exported: boolean;
  exported_at: string | null;
  created_at: string;
};

export type StudentStats = {
  total: number;
  exported: number;
  pending: number;
  byGender: Array<{ gender: string; count: number }>;
  byCourse: Array<{ course_name: string; count: number }>;
};

export type DashboardStats = {
  total: number;
  exported: number;
  pending: number;
  byGender: Array<{ gender: string; count: number }>;
  byCourse: Array<{ course_name: string; count: number }>;
  recentStats: {
    registrations: number;
    exports: number;
  };
  trends: {
    registrations: Array<{ date: string; count: number }>;
    exports: Array<{ date: string; count: number }>;
  };
};

export interface SubmissionStatus {
  submitted: boolean;
  name?: string;
  submissionDate?: string;
}

export async function fetchStudents(): Promise<Student[]> {
  const token = getAuthToken();
  const response = await fetch(`${API_ENDPOINTS.students}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to fetch students');
  }

  return response.json();
}

export async function fetchStudent(id: number): Promise<Student> {
  const token = getAuthToken();
  const response = await fetch(`${API_ENDPOINTS.students}/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to fetch student');
  }

  return response.json();
}

export async function exportStudent(id: number): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_ENDPOINTS.students}/${id}/export`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to export student');
  }
}

export async function exportStudents(ids: number[]): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_ENDPOINTS.students}/export/batch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to export students');
  }
}

export async function exportNewStudents(): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_ENDPOINTS.students}/export/new`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('No new students to export');
    }
    const data = await response.json();
    throw new Error(data.error || 'Failed to export new students');
  }

  // Get the filename from the Content-Disposition header
  const contentDisposition = response.headers.get('Content-Disposition');
  const filename = contentDisposition?.split('filename=')[1].replace(/['"]/g, '') || `new_students_${Date.now()}.xlsx`;

  // Download the file
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function exportSelectedStudents(ids: number[]): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_ENDPOINTS.students}/export/selected`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ids })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to export selected students');
  }

  // Get the filename from the Content-Disposition header
  const contentDisposition = response.headers.get('Content-Disposition');
  const filename = contentDisposition?.split('filename=')[1].replace(/['"]/g, '') || `selected_students_${Date.now()}.xlsx`;

  // Download the file
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function fetchStudentStats(): Promise<StudentStats> {
  const token = getAuthToken();
  const response = await fetch(`${API_ENDPOINTS.students}/stats/summary`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to fetch student statistics');
  }

  return response.json();
}

export async function exportAllPending(): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_ENDPOINTS.admin}/students/export-all-pending`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to export students');
  }

  // Convert response to blob and download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'students.xlsx';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const token = getAuthToken();
  const response = await fetch(`${API_ENDPOINTS.dashboard}/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to fetch dashboard statistics');
  }

  return response.json();
}

export async function submitStudentInfo(data: any, token: string) {
  const response = await fetch(`${API_ENDPOINTS.students}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit student information');
  }

  return response.json();
}

export async function checkSubmissionStatus(token: string): Promise<SubmissionStatus> {
  // Only make the API call if user is a student
  const role = getRole();
  if (role !== 'student') {
    throw new Error('Access denied. Only students can check submission status.');
  }

  const response = await fetch(`${API_ENDPOINTS.status}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Access denied. Only students can check submission status.');
    }
    throw new Error('Failed to check submission status');
  }

  return response.json();
}

export async function clearAllStudentData(): Promise<{ studentsRemoved: number; usersRemoved: number }> {
  const token = getAuthToken();
  const response = await fetch(`${API_ENDPOINTS.admin}/clear-student-data`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to clear student data');
  }

  return response.json();
}
