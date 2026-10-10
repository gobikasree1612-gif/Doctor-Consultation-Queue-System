import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import BookingConfirmationModal from '../components/BookingConfirmationModal';
import { ListFilter, Calendar, Clock, Phone, FileText, Ban, Eye, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyBookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedBookingForView, setSelectedBookingForView] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bookings/my');
      setBookings(response.data.bookings || []);
    } catch (err) {
      setError('Failed to load your booking history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This will restore capacity for other patients.')) {
      return;
    }

    setCancellingId(bookingId);
    setError('');
    setSuccess('');

    try {
      const response = await api.post(`/bookings/${bookingId}/cancel`);
      setSuccess(`Booking ${response.data.booking.booking_code} has been cancelled. Capacity restored (BR9).`);
      fetchMyBookings();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase tracking-wider mb-1">
              <ListFilter className="w-4 h-4" />
              Patient Booking History
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              My Consultation Bookings
            </h1>
            <p className="text-xs text-slate-500">
              View your active, completed, or cancelled consultation bookings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchMyBookings}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Book New Slot
            </Link>
          </div>
        </div>

        <Alert type="error" message={error} onClose={() => setError('')} />
        <Alert type="success" message={success} onClose={() => setSuccess('')} />

        {loading ? (
          <div className="py-16 text-center text-slate-400 font-medium">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-sky-600" />
            Loading your bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 max-w-md mx-auto my-8 shadow-xs">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">No Bookings Found</h3>
            <p className="text-xs text-slate-500 mb-6">You have not reserved any doctor consultation slots yet.</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs shadow-md hover:bg-sky-700 transition-colors"
            >
              Explore Consultation Slots
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Booking ID</th>
                    <th className="px-6 py-4">Consultation Slot</th>
                    <th className="px-6 py-4">Date & Qty</th>
                    <th className="px-6 py-4">Saved Fare</th>
                    <th className="px-6 py-4">Grand Total</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-extrabold text-sky-800 whitespace-nowrap">
                        {booking.booking_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{booking.saved_slot_name}</div>
                        <div className="text-[11px] text-slate-500">{booking.saved_category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-slate-900 font-bold">{booking.consultation_date}</div>
                        <div className="text-slate-500">{booking.quantity} Slot(s)</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-slate-700">₹{booking.saved_rate}</span>
                        <span className="text-[10px] text-slate-400 block">per slot</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-extrabold text-sky-700">₹{booking.grand_total}</span>
                        {booking.booking_charge > 0 && (
                          <span className="text-[10px] text-amber-700 block">+₹50 fee</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => setSelectedBookingForView(booking)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-600" />
                          Details
                        </button>

                        {booking.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingId === booking.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Ban className="w-3.5 h-3.5 text-red-500" />
                            {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Details View Modal */}
      {selectedBookingForView && (
        <BookingConfirmationModal
          booking={selectedBookingForView}
          onClose={() => setSelectedBookingForView(null)}
        />
      )}
    </div>
  );
};

export default MyBookingsPage;
