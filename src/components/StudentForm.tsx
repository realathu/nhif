import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { Warning, CheckCircle, CircleNotch } from '@phosphor-icons/react';
import { checkSubmissionStatus, SubmissionStatus } from '../services/students';
import { auth } from '../services/auth';

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
  const [isLoading, setIsLoading] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null);
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const token = auth.getToken();
        if (!token) {
          navigate('/login');
          return;
        }

        const status = await checkSubmissionStatus(token);
        setSubmissionStatus(status);
      } catch (error) {
        console.error('Error checking submission status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();

    // Get user email from token
    const token = auth.getToken();
    if (token) {
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        setUserEmail(tokenData.email || "Student");
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }

    // Fetch dynamic fields
    const fetchDynamicFields = async () => {
      try {
        const token = auth.getToken();
        if (!token) return;

        const [coursesRes, datesRes] = await Promise.all([
          fetch('/api/dynamic-fields/course_name', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/dynamic-fields/admission_date', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (coursesRes.ok && datesRes.ok) {
          const courses = await coursesRes.json();
          const dates = await datesRes.json();
          setCourseOptions(courses);
          setAdmissionDates(dates);
        }
      } catch (error) {
        console.error('Error fetching dynamic fields:', error);
      }
    };

    fetchDynamicFields();
  }, [navigate]);

  // Show loading spinner while checking status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <CircleNotch size={32} className="text-blue-600 animate-spin" />
      </div>
    );
  }

  // Show submission status message if already submitted
  if (submissionStatus?.submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={32} weight="fill" className="text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900">Already Submitted</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Dear {submissionStatus.name},<br />
              Your NHIF details were submitted on {submissionStatus.submissionDate ? new Date(submissionStatus.submissionDate).toLocaleDateString() : 'N/A'}.
              For any changes, please contact the Dean's Office.
            </p>

            <button
              onClick={() => {
                auth.logout();
                navigate('/login');
              }}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await validationSchema.validate(formData, { abortEarly: false });
      setShowConfirmation(true);
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const newErrors: Record<string, string> = {};
        err.inner.forEach((error) => {
          if (error.path) {
            newErrors[error.path] = error.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const handleConfirmedSubmit = async () => {
    try {
      setIsSubmitting(true);
      setShowConfirmation(false);
      
      const token = auth.getToken();
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
        throw new Error('Failed to submit form');
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Form submission error:', error);
      alert(error instanceof Error ? error.message : "Failed to submit form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
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

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={32} weight="fill" className="text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900">Successfully Submitted</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                Dear {formData.first_name},<br /><br />
                Your information has been submitted to the Dean's Office. You will receive your NHIF control number via SMS for payment once processed.
              </p>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">What's Next:</h3>
                <ul className="text-gray-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="block w-1 h-1 rounded-full bg-gray-400"></span>
                    Wait for an SMS with your NHIF control number
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="block w-1 h-1 rounded-full bg-gray-400"></span>
                    Use the control number to make your payment
                  </li>
                </ul>
              </div>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Close & Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Warning size={24} weight="fill" className="text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900">Confirmation</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Please ensure all information provided matches your official documents. Incorrect information may affect your NHIF registration.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:bg-green-300"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}