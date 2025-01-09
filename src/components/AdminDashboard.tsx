import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartBar,
  Users,
  Gear,
  SignOut,
  List,
  X
} from '@phosphor-icons/react';

import { DashboardView } from './admin/DashboardView';
import { StudentsView } from './admin/StudentsView';
import { SettingsView } from './admin/SettingsView';
import { auth } from '../services/auth';

export function AdminDashboard() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'students' | 'settings'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const token = auth.getToken();
    const role = auth.getRole();
    
    if (!token || role !== 'admin') {
      navigate('/login');
      return;
    }

    // Get user email from token
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      setUserEmail(tokenData.email || "Admin");
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  }, [navigate]);

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 border-r border-gray-200`}>
        <div className="p-4 flex justify-between items-center border-b border-gray-200">
          <h2 className={`font-bold text-gray-800 ${sidebarOpen ? 'block' : 'hidden'}`}>Admin Panel</h2>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
        
        <nav className="mt-6">
          <div className="px-4 space-y-2">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center space-x-2 w-full p-3 rounded-lg transition-colors ${
                currentView === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <ChartBar size={24} />
              {sidebarOpen && <span>Dashboard</span>}
            </button>
            
            <button 
              onClick={() => setCurrentView('students')}
              className={`flex items-center space-x-2 w-full p-3 rounded-lg transition-colors ${
                currentView === 'students' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <Users size={24} />
              {sidebarOpen && <span>Students</span>}
            </button>
            
            <button 
              onClick={() => setCurrentView('settings')}
              className={`flex items-center space-x-2 w-full p-3 rounded-lg transition-colors ${
                currentView === 'settings' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <Gear size={24} />
              {sidebarOpen && <span>Settings</span>}
            </button>
            
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 w-full p-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
            >
              <SignOut size={24} />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentView === 'dashboard' && 'Dashboard'}
              {currentView === 'students' && 'Students'}
              {currentView === 'settings' && 'Settings'}
            </h1>
            <div className="text-sm text-gray-600">
              Welcome, {userEmail}
            </div>
          </div>
        </header>

        <main className="p-6">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'students' && <StudentsView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}