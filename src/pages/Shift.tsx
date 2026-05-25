import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, RefreshCw, Calendar, FileText } from 'lucide-react';
import { useApp } from '../AppContext';
import { motion } from 'motion/react';

const SHIFTS = [
  'Pagi (08:00 - 17:00)',
  'Siang (12:00 - 21:00)',
  'Malam (21:00 - 06:00)',
];

export default function Shift() {
  const navigate = useNavigate();
  const { addShiftRequest, user } = useApp();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [requestedShift, setRequestedShift] = useState(SHIFTS[0]);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    addShiftRequest({
      userId: user?.id || '1',
      date,
      currentShift: 'Pagi (08:00 - 17:00)',
      requestedShift,
      reason,
    });

    setSubmitted(true);
    setTimeout(() => navigate('/'), 2000);
  };

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white h-full">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4"
        >
          <RefreshCw size={40} />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 italic text-center">Pengajuan Terkirim!</h2>
        <p className="text-gray-500 text-center font-medium">Permohonan tukar/ubah shift Anda telah berhasil diajukan.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-primary px-6 py-6 text-white flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Ubah / Tukar Shift</h1>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4 border border-gray-100">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                Tanggal Efektif
              </label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <RefreshCw size={16} className="text-primary" />
                Shift yang Diinginkan
              </label>
              <select 
                value={requestedShift}
                onChange={(e) => setRequestedShift(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                required
              >
                {SHIFTS.map(shift => (
                  <option key={shift} value={shift}>{shift}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                Alasan Perubahan
              </label>
              <textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tuliskan alasan perubahan shift..."
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium min-h-[120px]"
                required
              ></textarea>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3"
          >
            <Send size={20} />
            Ajukan Perubahan
          </button>
        </form>
      </div>
    </div>
  );
}
