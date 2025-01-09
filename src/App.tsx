import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentForm } from './components/StudentForm';
import { auth } from './services/auth';
import { PrivateRoute } from './components/auth/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/admin/*" 
          element={
            <PrivateRoute requiredRole="admin">
              <AdminDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/form" 
          element={
            <PrivateRoute requiredRole="student">
              <StudentForm />
            </PrivateRoute>
          } 
        />
        <Route 
          path="*" 
          element={
            <Navigate 
              to={
                auth.getToken()
                  ? auth.getRole() === 'admin'
                    ? '/admin'
                    : '/form'
                  : '/login'
              } 
              replace 
            />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;