import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { ChevronLeft, RefreshCw, Calendar, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function ShiftHistory() {
  const navigate = useNavigate();
  const { user, shiftRequests } = useApp();

  const userShifts = shiftRequests.filter(r => r.userId === user?.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-600 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-600 border-red-200';
      default: return 'bg-orange-100 text-orange-600 border-orange-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 size={14} />;
      case 'rejected': return <XCircle size={14} />;
      default: return <Clock3 size={14} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      default: return 'Menunggu';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-primary p-6 pt-10 text-white flex items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <button onClick={() => navigate(-1)} className="p-2 bg-white/20 rounded-xl relative z-10">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-black relative z-10 italic">Riwayat Tukar Shift</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <AnimatePresence mode="popLayout">
          {userShifts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-gray-400"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <RefreshCw size={32} />
              </div>
              <p className="font-bold">Belum ada riwayat tukar shift</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {userShifts.map((req, idx) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">
                        S
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-800">Tukar Shift</h4>
                        <p className="text-[10px] font-bold text-gray-400">ID: #{req.id.substring(0, 8)}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black ${getStatusColor(req.status)}`}>
                      {getStatusIcon(req.status)}
                      {getStatusLabel(req.status)}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Dari Shift</span>
                        <span className="text-[10px] font-bold text-gray-700 text-center">{req.currentShift}</span>
                      </div>
                      <ChevronLeft size={16} className="text-gray-300 rotate-180" />
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">Ke Shift</span>
                        <span className="text-[10px] font-black text-blue-600 text-center">{req.requestedShift}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Calendar size={14} className="text-gray-300" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Tanggal Efektif</span>
                      <span className="text-[11px] font-bold text-gray-700">{format(new Date(req.date), 'dd MMMM yyyy', { locale: id })}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-3 border border-dashed border-gray-200">
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic line-clamp-2">
                       "{req.reason}"
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
