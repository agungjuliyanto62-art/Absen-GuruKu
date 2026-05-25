import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  CalendarDays, 
  ChevronRight, 
  Clock, 
  FileText, 
  Hourglass,
  ArrowRightCircle,
  RefreshCw,
  CheckCircle2,
  Clock3,
  XCircle,
  LogIn,
  LogOut,
  MapPin,
  Camera,
  Calendar,
  Download,
  FileSpreadsheet,
  FileBadge
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, getMonth, getYear } from 'date-fns';
import { id } from 'date-fns/locale';

interface SummaryItemProps {
  label: string;
  value: string;
  colorClass: string;
  barColor: string;
}

const SummaryItem = ({ label, value, colorClass, barColor }: SummaryItemProps) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-center pr-1">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <p className={`text-base font-black italic uppercase ${colorClass}`}>{value.split(' ')[0]}</p>
      <span className="text-[8px] font-black text-slate-300 uppercase italic">{value.split(' ')[1]}</span>
    </div>
    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: '70%' }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full rounded-full ${barColor}`} 
      ></motion.div>
    </div>
  </div>
);

interface MenuSectionProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  onClick?: () => void;
}

const MenuSection = ({ icon, title, desc, color, onClick }: MenuSectionProps) => (
  <motion.button 
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full bg-white rounded-3xl p-4 flex items-center justify-between shadow-sm border border-slate-100 mb-3"
  >
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white p-2.5`}>
         {icon}
      </div>
      <div className="text-left">
         <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{title}</h4>
         <p className="text-[9px] text-slate-400 font-bold italic uppercase">{desc}</p>
      </div>
    </div>
    <ChevronRight size={18} className="text-slate-300" />
  </motion.button>
);

export default function History() {
  const { user, attendanceData, leaveRequests, overtimeRequests } = useApp();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDownloadExcel = () => {
    const { attendances } = filteredData;
    if (attendances.length === 0) {
      alert('Tidak ada data absensi untuk periode ini.');
      return;
    }

    // Header for CSV (Excel compatible)
    let csvContent = "\uFEFF"; // UTF-8 BOM for Excel
    csvContent += "No;Tanggal;Nama;Status;Jam Masuk;Jam Pulang;Lokasi;Koordinat In;Koordinat Out\n";

    // Rows
    attendances.forEach((record, index) => {
      const u = user; // Current user
      const row = [
        index + 1,
        format(parseISO(record.date), 'dd/MM/yyyy'),
        `"${u?.name}"`,
        getStatusLabel(record.status),
        record.clockIn || '-',
        record.clockOut || '-',
        "Sekolah",
        record.locationIn || '-',
        record.locationOut || '-'
      ].join(";"); // Use semicolon for excel in some locales
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ABSENSI_${user?.name?.toUpperCase().replace(/ /g, '_')}_${format(selectedDate, 'MM_yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    const { attendances } = filteredData;
    if (attendances.length === 0) {
      alert('Tidak ada data absensi untuk periode ini.');
      return;
    }

    const doc = new jsPDF();
    const tableColumn = ["No", "Tanggal", "Nama", "Status", "Jam Masuk", "Jam Pulang", "Lokasi"];
    const tableRows: any[] = [];

    attendances.forEach((record, index) => {
      const rowData = [
        index + 1,
        format(parseISO(record.date), 'dd/MM/yyyy'),
        user?.name || '-',
        getStatusLabel(record.status),
        record.clockIn || '-',
        record.clockOut || '-',
        record.locationIn || 'Sekolah'
      ];
      tableRows.push(rowData);
    });

    // Set header
    doc.setFontSize(18);
    doc.text("LAPORAN ABSENSI", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Nama: ${user?.name}`, 14, 30);
    doc.text(`Periode: ${months[getMonth(selectedDate)]} ${getYear(selectedDate)}`, 14, 36);
    doc.text(`NUPTK/ID: ${user?.employeeId || '-'}`, 14, 42);

    // Add table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    // Save PDF
    const fileName = `ABSENSI_${user?.name?.toUpperCase().replace(/ /g, '_')}_${format(selectedDate, 'MM_yyyy')}.pdf`;
    doc.save(fileName);
  };

  const monthStr = format(selectedDate, 'MM');
  const yearStr = format(selectedDate, 'yyyy');

  const filteredData = useMemo(() => {
    const month = getMonth(selectedDate);
    const year = getYear(selectedDate);
    const day = format(selectedDate, 'd'); // We assume the state always has a valid day

    // For the summary/stats, we usually want the WHOLE month
    // But for "Riwayat Aktivitas", we might want to filter by day if requested
    const attendances = attendanceData.filter(r => {
      const d = parseISO(r.date);
      return r.userId === user?.id && getMonth(d) === month && getYear(d) === year;
    });

    const leaves = leaveRequests.filter(r => {
      const d = parseISO(r.startDate);
      return r.userId === user?.id && getMonth(d) === month && getYear(d) === year;
    });

    const overtimes = overtimeRequests.filter(r => {
      const d = parseISO(r.date);
      return r.userId === user?.id && getMonth(d) === month && getYear(d) === year;
    });

    return { attendances, leaves, overtimes };
  }, [selectedDate, attendanceData, leaveRequests, overtimeRequests, user]);

  const stats = useMemo(() => {
    const { attendances, leaves, overtimes } = filteredData;
    
    return {
      hadir: attendances.filter(r => r.status === 'hadir').length,
      izin: leaves.filter(r => r.type === 'izin' && r.status === 'approved').length,
      sakit: leaves.filter(r => r.type === 'sakit' && r.status === 'approved').length,
      cuti: leaves.filter(r => r.type === 'cuti' && r.status === 'approved').length,
      alpha: attendances.filter(r => r.status === 'alpha').length,
      terlambat: attendances.filter(r => r.status === 'terlambat' || r.status === 'late').length,
      pulangCepat: attendances.filter(r => r.status === 'pulang_cepat').length,
      lembur: overtimes.filter(r => r.status === 'approved').length,
      noClockOut: attendances.filter(r => r.clockIn && !r.clockOut).length
    };
  }, [filteredData]);

  const activities = useMemo(() => {
    const { attendances, leaves, overtimes } = filteredData;

    return [
      ...attendances.map(a => ({
        id: a.id,
        type: 'attendance',
        date: a.date,
        time: a.clockIn || '--:--',
        timeOut: a.clockOut,
        status: a.status,
        icon: <LogIn size={16} />,
        title: a.status === 'hadir' ? 'Absensi Masuk' : a.status === 'terlambat' ? 'Terlambat' : 'Absensi',
        color: 'indigo',
        photo: a.photoIn,
        photoOut: a.photoOut,
        location: a.locationIn,
        locationOut: a.locationOut
      })),
      ...leaves.map(l => ({
        id: l.id,
        type: 'leave',
        date: l.startDate,
        time: 'Full Day',
        status: l.status,
        icon: <FileText size={16} />,
        title: `Pengajuan ${l.type.replace('_', ' ')}`,
        color: 'emerald',
        reason: l.reason
      })),
      ...overtimes.map(o => ({
        id: o.id,
        type: 'overtime',
        date: o.date,
        time: `${o.startTime} - ${o.endTime}`,
        status: o.status,
        icon: <Hourglass size={16} />,
        title: 'Pengajuan Lembur',
        color: 'amber',
        reason: o.reason
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredData]);

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'approved': return 'Disetujui';
      case 'hadir': return 'Hadir';
      case 'rejected': return 'Ditolak';
      case 'terlambat':
      case 'late': return 'Terlambat';
      case 'pulang_cepat': return 'Plg Cepat';
      case 'izin': return 'Izin';
      case 'sakit': return 'Sakit';
      case 'cuti': return 'Cuti';
      default: return 'Menunggu';
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved':
      case 'hadir': return 'bg-emerald-100 text-emerald-600';
      case 'rejected':
      case 'alpha': return 'bg-rose-100 text-rose-600';
      case 'terlambat':
      case 'late':
      case 'pulang_cepat': return 'bg-amber-100 text-amber-600';
      default: return 'bg-indigo-100 text-indigo-600';
    }
  }

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const years = Array.from({ length: 5 }, (_, i) => 2024 + i);

  return (
    <div className="flex flex-col h-full bg-slate-50 pb-24">
      {/* Mesh Header */}
      <div className="relative h-64 bg-indigo-600 px-6 pt-12 overflow-hidden shrink-0">
         <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-[80px]"></div>
         </div>
         <div className="relative z-10 flex items-end justify-between gap-2">
            <div className="flex flex-col gap-2">
               <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Data Absensi</h2>
               <p className="text-indigo-100 font-bold text-xs uppercase tracking-widest opacity-80">Riwayat & Laporan Kehadiran</p>
            </div>
            <div className="flex gap-2">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleDownloadExcel}
                className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-white border border-white/20 shadow-lg group relative"
                title="Unduh Excel"
              >
                 <FileSpreadsheet size={16} className="text-emerald-300" />
                 <span className="text-[7px] font-black uppercase mt-1">Excel</span>
              </motion.button>
              
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={handleDownloadPDF}
                className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-white border border-white/20 shadow-lg"
                title="Unduh PDF"
              >
                 <FileText size={16} className="text-rose-300" />
                 <span className="text-[7px] font-black uppercase mt-1">PDF</span>
              </motion.button>
            </div>
         </div>
      </div>

      <div className="px-5 -mt-24 relative z-20 flex-1 overflow-y-auto pb-8 scrollbar-hide">
        {/* Rekap Card */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-2xl shadow-indigo-100/50 border border-slate-100 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h3 className="text-sm font-black text-slate-800 uppercase italic tracking-widest">Rekap Absensi</h3>
            <button 
              onClick={() => setShowDatePicker(true)}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl flex flex-col items-center shadow-xl shadow-indigo-200 transition-transform active:scale-95"
            >
               <span className="text-[9px] font-black uppercase opacity-70 italic tracking-widest">Pilih Periode</span>
               <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span className="text-xs font-black uppercase italic">
                    {format(selectedDate, 'dd', { locale: id })} {months[getMonth(selectedDate)]} {getYear(selectedDate)}
                  </span>
                  <ChevronRight size={14} className="rotate-90" />
               </div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
             <SummaryItem label="Hadir" value={`${stats.hadir} Hari`} colorClass="text-emerald-500" barColor="bg-emerald-500" />
             <SummaryItem label="Alpa" value={`${stats.alpha} Hari`} colorClass="text-rose-500" barColor="bg-rose-500" />
             <SummaryItem label="Sakit" value={`${stats.sakit} Hari`} colorClass="text-blue-500" barColor="bg-blue-500" />
             
             <SummaryItem label="Izin" value={`${stats.izin} Hari`} colorClass="text-indigo-500" barColor="bg-indigo-500" />
             <SummaryItem label="Cuti" value={`${stats.cuti} Hari`} colorClass="text-slate-400" barColor="bg-slate-400" />
             <SummaryItem label="Lembur" value={`${stats.lembur} Kali`} colorClass="text-amber-500" barColor="bg-amber-500" />

             <SummaryItem label="Terlambat" value={`${stats.terlambat} Kali`} colorClass="text-orange-500" barColor="bg-orange-500" />
             <SummaryItem label="Plg Cepat" value={`${stats.pulangCepat} Kali`} colorClass="text-rose-400" barColor="bg-rose-400" />
             <SummaryItem label="Tak Absen Plg" value={`${stats.noClockOut} Kali`} colorClass="text-slate-400" barColor="bg-slate-300" />
          </div>
        </div>

        {/* Original Menu List */}
        <div className="space-y-1 mb-8">
           <MenuSection 
              icon={<FileText size={24} />} 
              title="Data Izin" 
              desc="Data Izin / Cuti yang sudah disetujui" 
              color="bg-emerald-500"
              onClick={() => navigate('/history/izin')}
           />
           <MenuSection 
              icon={<Hourglass size={24} />} 
              title="Data Lembur" 
              desc="Data Lembur yang sudah disetujui" 
              color="bg-amber-500"
              onClick={() => navigate('/history/lembur')}
           />
           <MenuSection 
              icon={<RefreshCw size={24} />} 
              title="Data Tukar Shift" 
              desc="Data Perubahan/Tukar Shift" 
              color="bg-indigo-600"
              onClick={() => navigate('/history/shift')}
           />
        </div>

        {/* Activity Feed */}
        <div className="px-1 mb-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-[0.2em] italic">Riwayat Aktivitas</h3>
            <div className="h-[2px] flex-1 mx-4 bg-slate-100 rounded-full"></div>
          </div>

          <div className="space-y-4">
            {activities.length === 0 ? (
               <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <RefreshCw size={24} className="opacity-20" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest italic">Belum ada aktivitas di periode ini</p>
               </div>
            ) : (
              activities.map((act, idx) => (
                <motion.div 
                  key={`${act.type}-${act.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white p-3 ${
                        act.color === 'indigo' ? 'bg-indigo-600' : 
                        act.color === 'emerald' ? 'bg-emerald-600' : 'bg-amber-600'
                      } shadow-lg shadow-indigo-100`}>
                        {act.icon}
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-slate-800 uppercase tracking-tight">{act.title}</h5>
                        <p className="text-[10px] font-bold text-slate-400 italic">
                          {format(new Date(act.date), 'dd MMMM yyyy', { locale: id })}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase italic tracking-widest ${getStatusColor(act.status)}`}>
                      {getStatusLabel(act.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <Clock size={16} />
                      </div>
                      <div className="leading-tight">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Waktu Masuk</p>
                        <p className="text-[11px] font-black text-slate-700">{act.time}</p>
                      </div>
                    </div>
                    {act.type === 'attendance' && (
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (act.location) {
                            const url = `https://www.google.com/maps?q=${encodeURIComponent(act.location)}`;
                            window.open(url, '_blank');
                          }
                        }}
                        className="flex items-center gap-3 text-left group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                          <MapPin size={16} />
                        </div>
                        <div className="leading-tight overflow-hidden">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Lokasi Masuk</p>
                          <p className="text-[11px] font-black text-slate-700 truncate max-w-[100px] group-hover:text-indigo-600 transition-colors">
                            {act.location && act.location !== '-' ? act.location : 'Sekolah'}
                          </p>
                        </div>
                      </motion.button>
                    )}
                  </div>

                  {act.type === 'attendance' && act.timeOut && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                          <LogOut size={16} />
                        </div>
                        <div className="leading-tight">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Waktu Pulang</p>
                          <p className="text-[11px] font-black text-slate-700">{act.timeOut}</p>
                        </div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (act.locationOut) {
                            const url = `https://www.google.com/maps?q=${encodeURIComponent(act.locationOut)}`;
                            window.open(url, '_blank');
                          }
                        }}
                        className="flex items-center gap-3 text-left group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-600 group-hover:text-white transition-colors shadow-sm">
                          <MapPin size={16} />
                        </div>
                        <div className="leading-tight overflow-hidden">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Lokasi Pulang</p>
                          <p className="text-[11px] font-black text-slate-700 truncate max-w-[100px] group-hover:text-rose-600 transition-colors">
                            {act.locationOut && act.locationOut !== '-' ? act.locationOut : 'Sekolah'}
                          </p>
                        </div>
                      </motion.button>
                    </div>
                  )}

                  {act.type === 'attendance' && act.photo && (
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-100 group">
                      <img src={act.photo} alt="Bukti Foto" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                  )}

                  {(act.type === 'leave' || act.type === 'overtime') && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Keterangan:</p>
                       <p className="text-[11px] font-medium text-slate-600 line-clamp-2">{act.reason}</p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Date Picker Modal */}
      <AnimatePresence>
        {showDatePicker && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDatePicker(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white rounded-[3rem] p-8 z-[101] shadow-2xl"
            >
              <h4 className="text-lg font-black text-slate-800 uppercase italic mb-6 tracking-tight">Pilih Periode</h4>
              
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Tanggal (Opsional)</p>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                      const isSelected = format(selectedDate, 'd') === String(d);
                      return (
                        <button
                          key={d}
                          onClick={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setDate(d);
                            setSelectedDate(newDate);
                          }}
                          className={`h-8 w-8 rounded-lg text-[10px] font-black transition-all flex items-center justify-center ${
                            isSelected 
                            ? 'bg-indigo-600 text-white shadow-lg' 
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Bulan</p>
                  <div className="grid grid-cols-3 gap-2">
                    {months.map((m, i) => (
                      <button
                        key={m}
                        onClick={() => setSelectedDate(new Date(getYear(selectedDate), i))}
                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${
                          getMonth(selectedDate) === i 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Tahun</p>
                  <div className="grid grid-cols-4 gap-2">
                    {years.map((y) => (
                      <button
                        key={y}
                        onClick={() => setSelectedDate(new Date(y, getMonth(selectedDate)))}
                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                          getYear(selectedDate) === y 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setShowDatePicker(false)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest mt-4"
                >
                  Terapkan Filter
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
