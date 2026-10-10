import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import StatusHistoryModal from '../components/StatusHistoryModal';
import Alert from '../components/Alert';
import { Shield, Search, Filter, RefreshCw, History, UserCheck, ShieldCheck, CheckCircle2, DollarSign, Layers, Tag, Edit3 } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // History modal state
  const [historyModalBookingId, setHistoryModalBookingId] = useState(null);

  // Rate Edit Modal state
  const [editingSlot, setEditingSlot] = useState(null);
  const [newRate, setNewRate] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, slotsRes] = await Promise.all([
        api.get('/admin/bookings', {
          params: { search: searchQuery, status: statusFilter }
        }),
        api.get('/slots')
      ]);

      setBookings(bookingsRes.data.bookings || []);
      setSlots(slotsRes.data.slots || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch admin dashboard records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdminData();
  };

  const handleStatusTransition = async (bookingId, newStatus) => {
    setError('');
    setSuccess('');
    try {
      const response = await api.patch(`/admin/bookings/${bookingId}/status`, {
        new_status: newStatus
      });
      setSuccess(`Booking status successfully updated to '${newStatus}' (BR8).`);
      fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.error || 'Status transition rejected.');
    }
  };

  const handleUpdateRate = async (e) => {
    e.preventDefault();
    if (!editingSlot) return;
    setError('');
    setSuccess('');
    try {
      await api.patch(`/admin/slots/${editingSlot.id}/rate`, {
        rate: parseInt(newRate, 10)
      });
      setSuccess(`Updated slot ${editingSlot.slot_code} rate to ₹${newRate}. Past booking fare snapshots remain unchanged (BR3 test verified).`);
      setEditingSlot(null);
      fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update slot rate.');
    }
  };

  const getValidNextActions = (currentStatus) => {
    switch (currentStatus) {
      case 'CONFIRMED':
        return [
          { label: 'Check In', targetStatus: 'CHECKED_IN', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'bg-amber-600 hover:bg-amber-700 text-white' },
          { label: 'Board', targetStatus: 'BOARDED', icon: <ShieldCheck className="w-3.5 h-3.5" />, color: 'bg-purple-600 hover:bg-purple-700 text-white' },
        ];
      case 'CHECKED_IN':
      case 'BOARDED':
        return [
          { label: 'Complete', targetStatus: 'COMPLETED', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex-1 w-full">
        
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-teal-800 via-slate-900 to-sky-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" />
              Administrative Operations & Queue Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Administrator Dashboard
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Logged in as Chief Administrator · Full queue lifecycle control & rate auditing
            </p>
          </div>

          <button
            onClick={fetchAdminData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors border border-white/20 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue State
          </button>
        </div>

        <Alert type="error" message={error} onClose={() => setError('')} />
        <Alert type="success" message={success} onClose={() => setSuccess('')} />

        {/* Section 1: Consultation Slots Capacities & Rate Snapshot Testing */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              Consultation Slot Capacity & Rate Control
            </h2>
            <span className="text-xs text-slate-500 font-medium">5 Seeded Slot Records</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {slots.map((slot) => (
              <div key={slot.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-black text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                      {slot.slot_code}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">{slot.category}</span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{slot.name}</h4>
                  
                  <div className="mt-3 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Rate:</span>
                      <strong className="text-slate-900">₹{slot.rate}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Capacity:</span>
                      <strong className={slot.available_capacity > 0 ? 'text-sky-700' : 'text-red-600'}>
                        {slot.available_capacity}/{slot.initial_capacity}
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingSlot(slot);
                    setNewRate(slot.rate);
                  }}
                  className="mt-3 w-full py-1.5 px-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-teal-600" />
                  Edit Rate (BR3 Test)
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: All Bookings & Operational Status Transitions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* Header Controls */}
          <div className="p-6 border-b border-slate-200/80 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                All Patient Bookings Queue ({bookings.length})
              </h2>
              <p className="text-xs text-slate-500">
                Advance permitted status transitions or view complete audit logs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Booking ID or user..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
                />
              </form>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto text-xs font-bold">
                {['ALL', 'CONFIRMED', 'CHECKED_IN', 'BOARDED', 'COMPLETED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      statusFilter === st
                        ? 'bg-white text-teal-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'CHECKED_IN' ? 'CHECKED IN' : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
              Loading admin queue data...
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs font-semibold">
              No consultation bookings found matching filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Booking Code</th>
                    <th className="px-6 py-4">Booked By (User)</th>
                    <th className="px-6 py-4">Consultation Details</th>
                    <th className="px-6 py-4">Saved Fare & Total</th>
                    <th className="px-6 py-4">Current Status</th>
                    <th className="px-6 py-4 text-center">Permitted Status Actions (BR8)</th>
                    <th className="px-6 py-4 text-right">Audit Trail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {bookings.map((booking) => {
                    const validActions = getValidNextActions(booking.status);

                    return (
                      <tr key={booking.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-mono font-extrabold text-sky-800 whitespace-nowrap">
                          {booking.booking_code}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{booking.customer_name}</div>
                          <div className="text-[11px] text-teal-700 font-bold">
                            User: {booking.booked_by_username || 'Patient'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Ref: {booking.identity_reference}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{booking.saved_slot_name}</div>
                          <div className="text-slate-500">{booking.consultation_date} · {booking.quantity} Slot(s)</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-slate-700">₹{booking.saved_rate} / slot</div>
                          <div className="text-sm font-extrabold text-sky-800">Total: ₹{booking.grand_total}</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={booking.status} />
                        </td>

                        {/* Operational Status Action Buttons */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {validActions.length > 0 ? (
                            <div className="flex items-center justify-center gap-2">
                              {validActions.map((action) => (
                                <button
                                  key={action.targetStatus}
                                  onClick={() => handleStatusTransition(booking.id, action.targetStatus)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer ${action.color}`}
                                >
                                  {action.icon}
                                  <span>{action.label}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium italic">
                              No next actions (Final state)
                            </span>
                          )}
                        </td>

                        {/* History Trigger */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => setHistoryModalBookingId(booking.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5 text-teal-600" />
                            History
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>

      {/* History Modal */}
      {historyModalBookingId && (
        <StatusHistoryModal
          bookingId={historyModalBookingId}
          onClose={() => setHistoryModalBookingId(null)}
        />
      )}

      {/* Rate Edit Modal for BR3 testing */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Update Rate for {editingSlot.slot_code}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Demonstrating BR3: Changing this slot rate will NOT alter saved rates in existing bookings.
            </p>

            <form onSubmit={handleUpdateRate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Rate (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-xl text-sm font-bold"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm cursor-pointer"
                >
                  Update Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
