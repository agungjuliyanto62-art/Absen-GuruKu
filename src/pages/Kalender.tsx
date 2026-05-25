import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar as CalendarIcon, Clock, Trash2, Edit2, X, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarReminder } from '../types';

export default function Kalender() {
  const navigate = useNavigate();
  const { reminders, addReminder, updateReminder, deleteReminder, user } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<CalendarReminder | null>(null);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');

  const handleOpenModal = (inputDate?: string, reminder: CalendarReminder | null = null) => {
    if (reminder) {
      setEditingReminder(reminder);
      setTitle(reminder.title);
      setDescription(reminder.description);
      setDate(reminder.date);
      setStartTime(reminder.startTime);
      setEndTime(reminder.endTime);
    } else {
      setEditingReminder(null);
      setTitle('');
      setDescription('');
      setDate(inputDate || new Date().toISOString().split('T')[0]);
      setStartTime('08:00');
      setEndTime('09:00');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!title || !date) return;

    const reminderData = {
      userId: user?.id || '1',
      title,
      description,
      date,
      startTime,
      endTime,
    };

    if (editingReminder) {
      updateReminder({ ...reminderData, id: editingReminder.id });
    } else {
      addReminder(reminderData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus pengingat ini?')) {
      deleteReminder(id);
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <h2 className="text-lg font-black text-gray-800 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: id })}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return (
      <div className="grid grid-cols-7 bg-white px-4 pt-4">
        {days.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest pb-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const formattedDate = format(day, 'yyyy-MM-dd');
        const hasReminders = reminders.some(r => r.date === formattedDate);
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={`relative h-14 flex flex-col items-center justify-center cursor-pointer transition-all ${
              !isCurrentMonth ? 'text-gray-200' : isSelected ? 'text-white' : 'text-gray-700'
            }`}
            onClick={() => {
              setSelectedDate(cloneDay);
              setDate(format(cloneDay, 'yyyy-MM-dd'));
            }}
          >
            {isSelected && (
              <motion.div 
                layoutId="activeDay"
                className="absolute inset-2 bg-primary rounded-xl z-0"
              />
            )}
            <span className="relative z-10 text-sm font-bold">{format(day, 'd')}</span>
            {hasReminders && !isSelected && (
              <div className="absolute bottom-2 w-1 h-1 bg-amber-400 rounded-full z-10" />
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 px-4 bg-white" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  const filteredReminders = reminders.filter(r => r.date === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden">
      <div className="bg-primary px-6 py-6 pt-10 text-white flex items-center justify-between z-10 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="flex items-center gap-4 relative z-10">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-black italic">Kalender Akademik</h1>
        </div>
        <button 
          onClick={() => handleOpenModal(format(selectedDate, 'yyyy-MM-dd'))}
          className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-colors relative z-10"
        >
          <Plus size={24} />
        </button>
      </div>

      {renderHeader()}
      {renderDays()}
      {renderCells()}

      <div className="bg-gray-100 flex-1 px-6 py-6 overflow-y-auto pb-24">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-gray-800 text-sm italic">
            Agenda: {format(selectedDate, 'dd MMMM', { locale: id })}
          </h3>
        </div>

        {filteredReminders.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
            <p className="text-xs font-bold uppercase tracking-widest text-center">Tidak ada agenda di tanggal ini</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReminders.map((reminder) => (
              <motion.div 
                key={reminder.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex gap-4"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                  <CalendarIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800 truncate pr-2">{reminder.title}</h3>
                    <div className="flex gap-1 shrink-0">
                      <button 
                        onClick={() => handleOpenModal(undefined, reminder)}
                        className="p-1 text-gray-400 hover:text-blue-500"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(reminder.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-gray-400 uppercase">
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-blue-400" />
                      <span>{reminder.startTime} - {reminder.endTime}</span>
                    </div>
                  </div>
                  {reminder.description && (
                    <p className="text-xs text-gray-500 mt-2 italic">"{reminder.description}"</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] p-8 pb-10 sm:pb-8 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-800 italic">
                  {editingReminder ? 'Ubah Agenda' : 'Tambah Agenda'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Judul Agenda</label>
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Rapat Wali Murid..."
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Mulai</label>
                    <input 
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Selesai</label>
                    <input 
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Keterangan</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detail kegiatan..."
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium min-h-[100px]"
                  />
                </div>

                <button 
                  onClick={handleSave}
                  className="w-full bg-primary text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 mt-4 italic"
                >
                  <Save size={20} />
                  {editingReminder ? 'Simpan Perubahan' : 'Simpan Agenda'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
