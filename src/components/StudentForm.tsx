import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from "yup";

const validationSchema = yup.object().shape({
  form_four_index_no: yup.string().required("Form Four Index Number is required"),
  first_name: yup.string().required("First Name is required"),
  middle_name: yup.string(),
  last_name: yup.string().required("Last Name is required"),
  date_of_birth: yup.date().required("Date of Birth is required"),
  marital_status: yup.string().required("Marital Status is required"),
  gender: yup.string().required("Gender is required"),
  admission_date: yup.date().required("Admission Date is required"),
  mobile_no: yup.string()
    .matches(/^0[67]\d{8}$/, "Phone number must start with 06 or 07 and be exactly 10 digits")
    .required("Mobile Number is required"),
  course_name: yup.string().required("Course Name is required"),
  year_of_study: yup.number()
    .min(1, "Year must be at least 1")
    .max(4, "Year cannot exceed 4")
    .required("Year of Study is required"),
  course_duration: yup.number()
    .min(1, "Duration must be at least 1")
    .max(4, "Duration cannot exceed 4")
    .required("Course Duration is required"),
  national_id: yup.string()
    .matches(/^\d{20}$/, "National ID must be exactly 20 digits")
    .required("National ID is required"),
  admission_no: yup.string().required("Admission Number is required"),
});

export function StudentForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    form_four_index_no: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    date_of_birth: "",
    marital_status: "",
    gender: "",
    admission_date: "",
    mobile_no: "",
    course_name: "",
    year_of_study: "",
    course_duration: "",
    national_id: "",
    admission_no: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courseOptions, setCourseOptions] = useState<string[]>([]);
  const [admissionDates, setAdmissionDates] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'student') {
      navigate('/login');
      return;
    }

    // Fetch user email from token
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      setUserEmail(tokenData.email || "Student");
    } catch (error) {
      console.error('Failed to decode token:', error);
    }

    // Fetch dynamic fields
    const fetchDynamicFields = async () => {
      try {
        const [coursesRes, datesRes] = await Promise.all([
          fetch('/api/dynamic-fields/course_name', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/dynamic-fields/admission_date', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (coursesRes.ok) {
          const courses = await coursesRes.json();
          setCourseOptions(courses);
        }

        if (datesRes.ok) {
          const dates = await datesRes.json();
          setAdmissionDates(dates);
        }
      } catch (error) {
        console.error('Failed to fetch dynamic fields:', error);
      }
    };

    fetchDynamicFields();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await validationSchema.validate(formData, { abortEarly: false });
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/students/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      alert('Your information has been successfully submitted. You will receive your control number via the provided phone number soon.');
    } catch (error) {
      if (error.inner) {
        const newErrors = {};
        error.inner.forEach(err => {
          newErrors[err.path] = err.message;
        });
        setErrors(newErrors);
      } else {
        alert(error.message || "Failed to submit form");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          NHIF Student Details
        </h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <span className="text-sm text-gray-600">Welcome, {userEmail}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Form Four Index Number</label>
            <input
              type="text"
              name="form_four_index_no"
              value={formData.form_four_index_no}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g., S1375/0123/2021"
            />
            {errors.form_four_index_no && (
              <p className="mt-1 text-sm text-red-600">{errors.form_four_index_no}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g., Onesmo"
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Middle Name</label>
            <input
              type="text"
              name="middle_name"
              value={formData.middle_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g., A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g., Mbilinyi"
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g., 2003-11-14"
            />
            {errors.date_of_birth && (
              <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Marital Status</label>
            <select
              name="marital_status"
              value={formData.marital_status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
            </select>
            {errors.marital_status && (
              <p className="mt-1 text-sm text-red-600">{errors.marital_status}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            {errors.gender && (
              <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Admission Date</label>
            <select
              name="admission_date"
              value={formData.admission_date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select date</option>
              {admissionDates.map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString()}
                </option>
              ))}
            </select>
            {errors.admission_date && (
              <p className="mt-1 text-sm text-red-600">{errors.admission_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
            <input
              type="tel"
              name="mobile_no"
              value={formData.mobile_no}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g., 0678538349"
            />
            {errors.mobile_no && (
              <p className="mt-1 text-sm text-red-600">{errors.mobile_no}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Course Name</label>
            <select
              name="course_name"
              value={formData.course_name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select course</option>
              {courseOptions.map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
            {errors.course_name && (
              <p className="mt-1 text-sm text-red-600">{errors.course_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Year of Study</label>
            <select
              name="year_of_study"
              value={formData.year_of_study}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select year</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
            {errors.year_of_study && (
              <p className="mt-1 text-sm text-red-600">{errors.year_of_study}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Course Duration (Years)</label>
            <select
              name="course_duration"
              value={formData.course_duration}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select duration</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
            {errors.course_duration && (
              <p className="mt-1 text-sm text-red-600">{errors.course_duration}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">National ID</label>
            <input
              type="text"
              name="national_id"
              value={formData.national_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g., 20031114451020000345"
            />
            {errors.national_id && (
              <p className="mt-1 text-sm text-red-600">{errors.national_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Admission Number</label>
            <input
              type="text"
              name="admission_no"
              value={formData.admission_no}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="e.g., DSM/BSLM/24/000456"
            />
            {errors.admission_no && (
              <p className="mt-1 text-sm text-red-600">{errors.admission_no}</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}