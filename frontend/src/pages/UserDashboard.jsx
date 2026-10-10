import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import BookingModal from '../components/BookingModal';
import BookingConfirmationModal from '../components/BookingConfirmationModal';
import Alert from '../components/Alert';
import { Search, Filter, Calendar, Clock, Tag, CheckCircle, AlertOctagon, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Modal states
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const response = await api.get('/slots');
      setSlots(response.data.slots || []);
    } catch (err) {
      setError('Failed to fetch consultation slots from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const categories = ['ALL', ...new Set(slots.map(s => s.category))];

  const filteredSlots = slots.filter(slot => {
    const matchesCategory = selectedCategory === 'ALL' || slot.category === selectedCategory;
    const matchesSearch = 
      slot.slot_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      slot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      slot.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalAvailableCount = slots.reduce((acc, slot) => acc + (slot.available_capacity > 0 ? 1 : 0), 0);

  const handleBookingSuccess = (booking) => {
    setSelectedSlotForBooking(null);
    setConfirmedBooking(booking);
    fetchSlots(); // Refresh slot availability
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-1 w-full">
        {/* Banner Welcome Section */}
        <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-600/15 mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
            <Sparkles className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs mb-3">
              <CheckCircle className="w-3.5 h-3.5 text-teal-300" />
              Patient Consultation Booking Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Patient'}!
            </h1>
            <p className="mt-2 text-sm text-sky-100 leading-relaxed">
              Search and reserve doctor consultation slots in real-time. View live fare breakdowns and manage your appointment queue.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                <span className="text-[10px] uppercase font-bold tracking-wider text-sky-200 block">Available Active Slots</span>
                <span className="text-xl font-black text-white">{totalAvailableCount} of {slots.length} Slots</span>
              </div>

              <Link
                to="/my-bookings"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-sky-900 font-bold text-xs shadow-md hover:bg-sky-50 transition-colors"
              >
                <span>Go to My Bookings</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <Alert type="error" message={error} onClose={() => setError('')} />

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search slot code (e.g. R101), name, department..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <span className="text-xs font-bold text-slate-500 uppercase shrink-0">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={fetchSlots}
              className="p-2 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-slate-100 transition-colors ml-auto cursor-pointer"
              title="Refresh Slots"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Consultation Slot Cards */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 font-medium">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-sky-600" />
            Loading consultation slots...
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <AlertOctagon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold">No active consultation slots matching your query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSlots.map((slot) => {
              const isAvailable = slot.is_active && slot.available_capacity > 0;
              const isR104 = slot.slot_code === 'R104';

              return (
                <div
                  key={slot.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                    isR104 || !isAvailable
                      ? 'border-slate-200 bg-slate-50/70 opacity-90'
                      : 'border-sky-100 hover:border-sky-300'
                  }`}
                >
                  <div className="p-6">
                    {/* Header Slot Code & Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                          {slot.slot_code}
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                          {slot.category}
                        </span>
                      </div>

                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                          Unavailable
                        </span>
                      )}
                    </div>

                    {/* Slot Name */}
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {slot.name}
                    </h3>

                    {/* Schedule */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="font-medium">{slot.schedule}</span>
                    </div>

                    {/* Capacity & Price Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Consultation Rate</span>
                        <span className="text-base font-extrabold text-slate-900">₹{slot.rate}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Available Capacity</span>
                        <span className={`text-base font-extrabold ${slot.available_capacity > 0 ? 'text-sky-700' : 'text-red-600'}`}>
                          {slot.available_capacity} / {slot.initial_capacity} Slots
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button
                      disabled={!isAvailable}
                      onClick={() => setSelectedSlotForBooking(slot)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        isAvailable
                          ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-500/20 cursor-pointer'
                          : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                      }`}
                    >
                      {isAvailable ? (
                        <>
                          <span>Book Consultation</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      ) : (
                        <span>Slot Unavailable</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Booking Form Modal */}
      {selectedSlotForBooking && (
        <BookingModal
          slot={selectedSlotForBooking}
          onClose={() => setSelectedSlotForBooking(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Booking Confirmation Modal */}
      {confirmedBooking && (
        <BookingConfirmationModal
          booking={confirmedBooking}
          onClose={() => setConfirmedBooking(null)}
        />
      )}
    </div>
  );
};

export default UserDashboard;
