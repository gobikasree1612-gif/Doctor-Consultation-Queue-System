import React from 'react';
import StatusBadge from './StatusBadge';
import { CheckCircle, Calendar, User, Phone, FileText, Hash, ArrowRight, ShieldCheck, Tag, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BookingConfirmationModal = ({ booking, onClose }) => {
  const navigate = useNavigate();

  if (!booking) return null;

  const handleGoToMyBookings = () => {
    onClose();
    navigate('/my-bookings');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Success Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 text-white mb-3 shadow-inner">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Booking Confirmed Successfully!</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Database transaction committed atomically (BR7).
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">

          {/* Booking ID & Status */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Unique Booking ID</span>
              <span className="text-base font-extrabold text-sky-800 font-mono">{booking.booking_code}</span>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Consultation Slot</span>
              <span className="font-bold text-slate-900 block">{booking.saved_slot_name}</span>
              <span className="text-slate-500 text-[11px]">{booking.saved_category}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Date & Quantity</span>
              <span className="font-bold text-slate-900 block">{booking.consultation_date}</span>
              <span className="text-sky-700 font-bold">{booking.quantity} Slot(s)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Customer Name & Phone</span>
              <span className="font-bold text-slate-900 block">{booking.customer_name}</span>
              <span className="text-slate-600">{booking.phone}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Identity / Ref ID</span>
              <span className="font-bold text-slate-900 block font-mono">{booking.identity_reference}</span>
            </div>
          </div>

          {/* Pricing Breakdown Snapshot (BR3 & BR4) */}
          <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100 space-y-2 text-xs">
            <div className="flex items-center gap-1 font-bold text-sky-900 uppercase tracking-wider text-[11px]">
              <Tag className="w-3.5 h-3.5 text-sky-600" />
              Saved Rate Snapshot (BR3 & BR4)
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Saved Rate per Slot:</span>
              <span className="font-semibold text-slate-900">₹{booking.saved_rate}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Base Amount (₹{booking.saved_rate} × {booking.quantity}):</span>
              <span className="font-semibold text-slate-900">₹{booking.base_amount}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Booking Charge:</span>
              <span className="font-semibold text-slate-900">₹{booking.booking_charge}</span>
            </div>

            <div className="pt-2 border-t border-sky-200 flex justify-between items-center text-sm font-bold">
              <span className="text-sky-950">Grand Total Paid:</span>
              <span className="text-lg font-extrabold text-sky-700">₹{booking.grand_total}</span>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleGoToMyBookings}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-500/20 transition-colors cursor-pointer"
            >
              <span>View in My Bookings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default BookingConfirmationModal;
