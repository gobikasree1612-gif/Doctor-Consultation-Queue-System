import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Alert from './Alert';
import { Calendar, User, Phone, FileText, CheckCircle2, X, AlertTriangle, Calculator, Sparkles } from 'lucide-react';

const BookingModal = ({ slot, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [consultationDate, setConsultationDate] = useState('');
  const [identityReference, setIdentityReference] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default tomorrow date
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setConsultationDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  if (!slot) return null;

  // Live calculation on frontend matching BR4
  const numQty = parseInt(quantity, 10) || 0;
  const baseAmount = slot.rate * numQty;
  const bookingCharge = numQty > 0 && baseAmount < 1000 ? 50 : 0;
  const grandTotal = baseAmount + bookingCharge;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend validations (matching BR1 & BR5)
    if (numQty < 1 || numQty > 5) {
      setError('Quantity must be a whole number between 1 and 5.');
      return;
    }
    if (!customerName.trim()) {
      setError('Full Name is required and cannot be blank.');
      return;
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      setError('Phone number must contain exactly 10 digits.');
      return;
    }
    if (!consultationDate) {
      setError('Consultation date is required.');
      return;
    }
    if (!identityReference.trim()) {
      setError('Identity / Reference ID is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/bookings', {
        slot_id: slot.id,
        quantity: numQty,
        customer_name: customerName.trim(),
        phone: phone.trim(),
        consultation_date: consultationDate,
        identity_reference: identityReference.trim()
      });

      if (onSuccess) {
        onSuccess(response.data.booking);
      }
    } catch (err) {
      const apiErr = err.response?.data?.error || 'Booking confirmation failed. Please review your details and try again.';
      setError(apiErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-teal-600 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/20 text-white text-xs font-semibold uppercase tracking-wider mb-1">
              Slot Code: {slot.slot_code}
            </div>
            <h2 className="text-xl font-bold">{slot.name}</h2>
            <p className="text-xs text-sky-100">{slot.category} · {slot.schedule}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <Alert type="error" message={error} onClose={() => setError('')} />

          {/* Quantity Input (BR1) */}
          <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100">
            <label className="block text-xs font-bold text-sky-900 uppercase tracking-wider mb-1">
              Select Booking Quantity (BR1: 1 - 5 whole numbers)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="5"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-28 text-center font-extrabold text-lg py-2 px-3 border border-sky-300 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white"
                required
              />
              <span className="text-xs text-slate-600 font-medium">
                Rate: <strong className="text-slate-900">₹{slot.rate}</strong> per consultation slot
              </span>
            </div>
          </div>

          {/* Customer Details (BR5) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number (10 Digits) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  maxLength="10"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Required Consultation Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="date"
                  value={consultationDate}
                  onChange={(e) => setConsultationDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Identity / Reference ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={identityReference}
                  onChange={(e) => setIdentityReference(e.target.value)}
                  placeholder="e.g. AADHAAR / Govt ID / Ref#"
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing Calculation Breakdown (BR4) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              <Calculator className="w-4 h-4 text-teal-600" />
              Fare Calculation Breakdown (BR4)
            </div>

            <div className="flex justify-between text-xs text-slate-600">
              <span>Base Amount (₹{slot.rate} × {numQty}):</span>
              <span className="font-semibold text-slate-900">₹{baseAmount}</span>
            </div>

            <div className="flex justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                Booking Charge:
                {baseAmount > 0 && baseAmount < 1000 ? (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">Base &lt; ₹1,000 → ₹50</span>
                ) : (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">Base ≥ ₹1,000 → FREE (₹0)</span>
                )}
              </span>
              <span className="font-semibold text-slate-900">₹{bookingCharge}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">Grand Total Amount:</span>
              <span className="text-lg font-extrabold text-sky-700">₹{grandTotal}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || slot.available_capacity < numQty}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Confirming Transaction...' : 'Confirm Booking'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default BookingModal;
