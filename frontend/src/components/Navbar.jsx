import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, LogOut, User, Shield, Calendar, ListFilter } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-200">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-sky-900 via-sky-700 to-teal-700 bg-clip-text text-transparent">
                Doctor Consultation Queue System
              </span>
              <span className="block text-[10px] tracking-wider uppercase text-slate-400 font-semibold">
                Sri Eshwar College of Engineering · SAT II
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            {!isAdmin ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/dashboard'
                      ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-200/60'
                      : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Available Slots
                </Link>
                <Link
                  to="/my-bookings"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/my-bookings'
                      ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-200/60'
                      : 'text-slate-600 hover:text-sky-600 hover:bg-slate-50'
                  }`}
                >
                  <ListFilter className="w-4 h-4" />
                  My Bookings
                </Link>
              </>
            ) : (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/admin'
                    ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200/60'
                    : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                }`}
              >
                <Shield className="w-4 h-4 text-teal-600" />
                Admin Dashboard
              </Link>
            )}
          </nav>

          {/* User Profile & Role Indicator */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className={`p-1.5 rounded-md ${isAdmin ? 'bg-teal-100 text-teal-700' : 'bg-sky-100 text-sky-700'}`}>
                {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="text-left leading-tight">
                <span className="block text-xs font-semibold text-slate-800">{user.name}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isAdmin ? 'text-teal-600' : 'text-sky-600'}`}>
                  {isAdmin ? 'Administrator' : 'User (Patient)'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
