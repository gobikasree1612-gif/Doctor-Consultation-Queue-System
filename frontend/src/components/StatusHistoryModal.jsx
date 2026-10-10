import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from './StatusBadge';
import { History, X, User, Clock, CheckCircle, ArrowRight } from 'lucide-react';

const StatusHistoryModal = ({ bookingId, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get(`/admin/bookings/${bookingId}/history`);
        setHistory(response.data.history || []);
      } catch (err) {
        setError('Failed to fetch status transition history.');
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) fetchHistory();
  }, [bookingId]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold">Status Audit Trail History</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              Loading transition history logs...
            </div>
          ) : error ? (
            <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>
          ) : history.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-6">No history records found.</div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {history.map((item, idx) => (
                <div key={item.id || idx} className="relative text-xs">
                  <div className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-teal-500 ring-4 ring-white" />
                  
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      {item.old_status && (
                        <>
                          <StatusBadge status={item.old_status} />
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </>
                      )}
                      <StatusBadge status={item.new_status} />
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      Changed by: <strong className="text-slate-700 font-bold">{item.changed_by}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {item.timestamp}
                    </span>
                  </div>

                  {item.note && (
                    <div className="mt-1.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 italic text-[11px]">
                      "{item.note}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Close History
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StatusHistoryModal;
