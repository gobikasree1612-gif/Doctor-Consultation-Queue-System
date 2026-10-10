import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';
import { Stethoscope, Shield, User, Lock, ArrowRight, Activity, CheckCircle } from 'lucide-react';

const LoginPage = () => {
  const [selectedRole, setSelectedRole] = useState('user');
  const [username, setUsername] = useState('user1');
  const [password, setPassword] = useState('User123!');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    if (role === 'user') {
      setUsername('user1');
      setPassword('User123!');
    } else {
      setUsername('admin');
      setPassword('Admin123!');
    }
    setError('');
  };

  const handleQuickLogin = (uname, pass, role) => {
    setSelectedRole(role);
    setUsername(uname);
    setPassword(pass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = await login(username, password);
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid login credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-teal-50/30 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Medical Icon Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white shadow-lg shadow-sky-500/25 mb-4">
          <Stethoscope className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Doctor Consultation Queue System
        </h1>
        <p className="mt-1 text-sm font-semibold text-sky-700 uppercase tracking-widest">
          Sri Eshwar College of Engineering · SAT II Practical
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/60 rounded-2xl border border-slate-100">

          {/* Role Selector Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Select Assessment Account Role
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleRoleChange('user')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'user'
                    ? 'bg-white text-sky-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4 text-sky-600" />
                User (Patient)
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-white text-teal-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-4 h-4 text-teal-600" />
                Administrator
              </button>
            </div>
          </div>

          <Alert type="error" message={error} onClose={() => setError('')} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 shadow-md shadow-sky-500/25 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In as {selectedRole === 'admin' ? 'Administrator' : 'User'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Preset Demo Accounts for Practical Assessment */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
              Faculty Demo Accounts:
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('user1', 'User123!', 'user')}
                className="w-full text-left p-2.5 rounded-xl border border-sky-100 bg-sky-50/60 hover:bg-sky-100/80 transition-colors flex items-center justify-between text-xs cursor-pointer group"
              >
                <div>
                  <span className="font-bold text-sky-900">User 1 (Patient)</span>
                  <span className="block text-slate-500 text-[11px]">user1 / User123!</span>
                </div>
                <span className="text-[11px] font-semibold text-sky-600 group-hover:underline">Quick Fill →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('user2', 'User123!', 'user')}
                className="w-full text-left p-2.5 rounded-xl border border-sky-100 bg-sky-50/60 hover:bg-sky-100/80 transition-colors flex items-center justify-between text-xs cursor-pointer group"
              >
                <div>
                  <span className="font-bold text-sky-900">User 2 (Patient)</span>
                  <span className="block text-slate-500 text-[11px]">user2 / User123!</span>
                </div>
                <span className="text-[11px] font-semibold text-sky-600 group-hover:underline">Quick Fill →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'Admin123!', 'admin')}
                className="w-full text-left p-2.5 rounded-xl border border-teal-100 bg-teal-50/60 hover:bg-teal-100/80 transition-colors flex items-center justify-between text-xs cursor-pointer group"
              >
                <div>
                  <span className="font-bold text-teal-900">Administrator</span>
                  <span className="block text-slate-500 text-[11px]">admin / Admin123!</span>
                </div>
                <span className="text-[11px] font-semibold text-teal-700 group-hover:underline">Quick Fill →</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
