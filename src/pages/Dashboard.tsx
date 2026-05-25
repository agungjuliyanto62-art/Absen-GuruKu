import React, { useState, useMemo } from 'react';
import { useApp } from '../AppContext';
import { 
  FileText, 
  Clock, 
  Calendar, 
  ChevronRight, 
  Bell, 
  Timer,
  Newspaper,
  School,
  Video,
  Hourglass,
  PenTool,
  LogOut,
  XCircle,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  iconBg?: string;
  iconColor?: string;
}

function MenuItem({ icon, label, onClick, iconBg = "bg-white", iconColor = "text-blue-500" }: MenuItemProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 group"
    >
      <div className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-gray-50 transition-all group-hover:shadow-lg`}>
        <div className={iconColor}>
          {icon}
        </div>
      </div>
      <span className="text-[13px] font-medium text-slate-600 text-center leading-tight">{label}</span>
    </motion.button>
  );
}

export default function Dashboard() {
  const { user, attendanceData, logout, settings, news, schoolProfile, notifications } = useApp();
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayRecord = attendanceData.find(r => r.date === todayStr && r.userId === user?.id);
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Auto-integrate status akses akun from Super Admin Tenant Configuration
  const tenantObj = useMemo(() => {
    try {
      const saved = localStorage.getItem('sa_tenants');
      if (saved) {
        const list = JSON.parse(saved);
        const match = list.find((t: any) => 
          (t.npsn && user?.employeeId && t.npsn.trim() === user?.employeeId.trim()) || 
          (t.name && schoolProfile?.name && (
            schoolProfile.name.toLowerCase().includes(t.name.toLowerCase()) || 
            t.name.toLowerCase().includes(schoolProfile.name.toLowerCase()) ||
            (schoolProfile.name.toLowerCase().includes('tulang bawang') && t.name.toLowerCase().includes('banjar margo'))
          ))
        );
        return match || null;
      }
    } catch (e) {
      console.error('Error matching tenant status:', e);
    }
    return null;
  }, [user, schoolProfile]);

  const schoolStatus = tenantObj ? tenantObj.status : 'Active';

  // State to handle visual status refreshing
  const [isSyncingStatus, setIsSyncingStatus] = useState(false);
  const handleRefreshStatus = () => {
    setIsSyncingStatus(true);
    setTimeout(() => {
      setIsSyncingStatus(false);
      window.location.reload();
    }, 1200);
  };

  // Display beautiful blocking lock overlays if the school's account status is locked by Super Admin
  if (schoolStatus === 'Suspended' || schoolStatus === 'Pending') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6 text-white text-sans select-none">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Glowing backdrops */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-10 pointer-events-none -mt-36 ${
            schoolStatus === 'Suspended' ? 'bg-rose-500' : 'bg-amber-500'
          }`} />

          <div className="flex flex-col items-center text-center">
            {/* Elegant Ring Icon */}
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border mb-6 relative ${
              schoolStatus === 'Suspended' 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {schoolStatus === 'Suspended' ? (
                <AlertCircle size={38} className="animate-pulse" />
              ) : (
                <Clock size={38} className="animate-pulse" />
              )}
            </div>

            {/* Pill Label */}
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-4 border ${
              schoolStatus === 'Suspended' 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {schoolStatus === 'Suspended' ? 'Sistem Ditangguhkan (Suspended)' : 'Verifikasi Akun Tertunda (Pending)'}
            </span>

            {/* School Name */}
            <h2 className="text-2xl font-black italic tracking-tight text-white leading-tight uppercase">
              {schoolProfile?.name || 'Sekolah Mitra Cloud'}
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">
              NPSN: {tenantObj?.npsn || user?.employeeId || 'Belum Terdaftar'} | Wilayah: {tenantObj?.area || 'Indonesia'}
            </p>

            <div className="w-full h-px bg-slate-850 my-6" />

            {/* Status Statement */}
            <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-sm">
              {schoolStatus === 'Suspended' ? (
                'Mohon maaf, sistem absen cloud untuk sekolah Anda ditangguhkan sementara oleh Super Admin dikarenakan keterlambatan perpanjangan sewa sistem. Silakan hubungi pihak Super Admin untuk mengaktifkan kembali akses layanan.'
              ) : (
                'Terima kasih telah bergabung. Status lisensi sekolah Anda saat ini sedang dikonfigurasi & diverifikasi oleh pihak Super Admin. Seluruh fitur absensi akan otomatis diaktifkan setelah verifikasi berkas selesai.'
              )}
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full mt-8">
              <button
                type="button"
                onClick={handleRefreshStatus}
                disabled={isSyncingStatus}
                className="flex-1 py-4 bg-white hover:bg-slate-100 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-slate-200 outline-none active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={14} className={isSyncingStatus ? 'animate-spin' : ''} />
                {isSyncingStatus ? 'Sinkronisasi...' : 'Hubungkan Ulang'}
              </button>

              <button
                type="button"
                onClick={() => { logout(); navigate('/login'); }}
                className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-slate-800 outline-none active:scale-95"
              >
                <LogOut size={14} />
                Keluar Sesi
              </button>
            </div>

            <p className="text-[9px] text-slate-600 font-extrabold uppercase mt-6 tracking-widest">
              SISTEM MULTI-TENANT CLOUD ABSENSI V3.0
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative">
      {/* Header Area */}
      <div className="relative h-[600px] bg-primary px-6 pt-10 overflow-hidden">
        {/* Advanced 3D Animated Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-30">
          <motion.div 
            animate={{ 
              rotateX: [0, 45, 0],
              rotateY: [0, 90, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-50%] grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] gap-2"
            style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
          >
            {[...Array(400)].map((_, i) => (
              <div 
                key={i} 
                className="w-1.5 h-1.5 bg-white/30 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
                style={{
                  transform: `translateZ(${Math.sin(i) * 60}px)`
                }}
              />
            ))}
          </motion.div>
          
          <div className="absolute top-0 right-0 w-full h-full">
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 rounded-full bg-blue-400/30 blur-2xl" />
          </div>
        </div>
        {/* Top Utility Bar */}
        <div className="relative z-20 flex justify-between items-center mb-6">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-lg font-bold text-white tracking-tight">
              Hallo, Selamat Datang
            </h1>
          </motion.div>

          <div className="flex gap-3">
            <motion.button 
              onClick={() => setShowNotif(true)}
              whileHover={{ rotate: 15, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-xl text-white flex items-center justify-center relative border border-white/30 shadow-xl group"
            >
              <Bell size={20} className="group-hover:animate-bounce" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-md border-2 border-white flex items-center justify-center text-[8px] font-black shadow-lg">
                  {unreadCount}
                </span>
              )}
            </motion.button>
            
            <motion.button 
              onClick={() => logout()}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.3)' }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 bg-white/20 backdrop-blur-xl rounded-xl text-white flex items-center justify-center border border-white/30 shadow-xl"
            >
              <LogOut size={20} />
            </motion.button>
          </div>
        </div>

        {/* User Profile Info */}
        <div className="flex justify-start items-start relative z-10 mb-4">
          <div className="flex items-center gap-4">
             <motion.div 
               initial={{ x: -30, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               whileHover={{ scale: 1.05 }}
               onClick={() => navigate('/profile')}
               className="w-16 h-16 rounded-2xl border-2 border-white/40 overflow-hidden bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl relative group cursor-pointer"
             >
                <img 
                   src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Staff')}&background=fff&color=2563eb&bold=true&size=128`} 
                  alt="Avatar"
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
             </motion.div>
             <motion.div 
               initial={{ x: 30, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               onClick={() => navigate('/profile')}
               className="text-white pt-1 cursor-pointer group"
             >
                <h2 className="text-md font-black tracking-tight leading-none mb-1 drop-shadow-lg opacity-90 uppercase italic group-hover:translate-x-1 transition-transform">
                   {user?.name}
                </h2>
                <div className="flex items-center gap-1.5">
                   <div className="relative flex h-1.5 w-1.5">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                   </div>
                   <p className="text-[9px] uppercase font-black tracking-[0.2em] text-white/70 drop-shadow-sm">
                     {user?.employeeId} • {user?.position || 'Staff'}
                   </p>
                </div>
             </motion.div>
          </div>
        </div>

        {/* Running Text / Marquee inside Header */}
        <div className="relative z-10 px-1">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-2 overflow-hidden shadow-lg relative">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: "-100%" }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear",
              }}
              className="inline-block whitespace-nowrap"
            >
              <span className="text-[11px] font-black italic text-white tracking-widest flex items-center gap-4 px-4 uppercase">
                <span className="text-yellow-400 animate-pulse">✨</span>
                {settings.runningText}
                <span className="text-white/40">|</span>
                Kepala Sekolah: {schoolProfile.headmaster}
                <span className="text-yellow-400 animate-pulse">✨</span>
              </span>
            </motion.div>
          </div>
        </div>

        {/* Date and Work Hours Info */}
        <div className="relative z-10 px-1 mt-2">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2 px-3.5 shadow-xl flex justify-between items-center text-white">
            <div className="flex flex-col">
              <div className="flex items-center gap-1 mb-0.5">
                <Calendar size={9} className="text-blue-300" />
                <span className="text-[8px] font-black uppercase tracking-[0.15em] opacity-60">Hari & Tanggal</span>
              </div>
              <span className="text-[11px] font-bold italic">{format(today, 'EEEE, dd MMMM yyyy', { locale: id })}</span>
            </div>
            
            <div className="flex gap-1.5">
              <div className="flex flex-col items-center">
                <span className="text-[7px] font-black uppercase tracking-widest opacity-50 mb-0.5 italic">Masuk</span>
                <div className="bg-green-500/20 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-green-400/30 flex items-center gap-1">
                  <div className="w-0.5 h-0.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[9px] font-black italic">{settings.workHours.entryStart}</span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[7px] font-black uppercase tracking-widest opacity-50 mb-0.5 italic">Pulang</span>
                <div className="bg-blue-500/20 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-blue-400/30 flex items-center gap-1">
                  <div className="w-0.5 h-0.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[9px] font-black italic">{settings.workHours.exitStart}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Shape at bottom */}
        <div className="absolute bottom-[-1px] left-0 w-full overflow-hidden leading-[0] transform rotate-180 z-10">
          <svg 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none" 
            className="relative block w-full h-[40px] fill-slate-50"
          >
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </div>

      {/* Main Menu Grid */}
      <div className="px-6 mt-10 mb-10">
        <h3 className="text-gray-800 font-bold mb-4">Menu Utama</h3>
        <div className="grid grid-cols-4 gap-x-2 gap-y-6">
          <MenuItem 
            icon={<FileText size={28} />} 
            label="Izin" 
            onClick={() => navigate('/izin')} 
          />
          <MenuItem 
            icon={<Hourglass size={28} />} 
            label="Lembur" 
            onClick={() => navigate('/lembur')}
          />
          <MenuItem 
            icon={<Clock size={28} />} 
            label="Shift" 
            onClick={() => navigate('/shift')}
          />
          <MenuItem 
            icon={<Calendar size={28} />} 
            label="Kalender" 
            onClick={() => navigate('/kalender')}
          />
          <MenuItem 
            icon={<PenTool size={28} />} 
            label="Aktivitas" 
            onClick={() => navigate('/aktivitas')}
          />
          <MenuItem 
            icon={<Newspaper size={28} />} 
            label="Berita" 
            onClick={() => navigate('/berita')}
          />
          <MenuItem 
            icon={<School size={28} />} 
            label="Profil Sekolah" 
            onClick={() => navigate('/profil-sekolah')}
          />
          <MenuItem 
            icon={<Video size={28} />} 
            label="Media" 
            onClick={() => navigate('/media-pembelajaran')}
          />
        </div>
      </div>

      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotif && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowNotif(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[70vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-primary" />
                  <h3 className="text-xs font-black uppercase italic tracking-widest">Notifikasi</h3>
                </div>
                <button onClick={() => setShowNotif(false)}><XCircle size={20} className="text-slate-300" /></button>
              </div>
              <div className="p-4 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <p className="text-[10px] font-black uppercase italic tracking-widest">Belum ada notifikasi</p>
                  </div>
                ) : (
                  notifications.sort((a,b) => b.date.localeCompare(a.date)).map(notif => (
                    <div key={notif.id} className="py-4 px-2 hover:bg-slate-50 transition-colors">
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${notif.type === 'announcement' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                          {notif.type === 'announcement' ? <Megaphone size={18} /> : <Newspaper size={18} />}
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-tight">{notif.title}</h4>
                          <p className="text-[10px] font-medium text-slate-500 mt-0.5 line-clamp-2">"{notif.message}"</p>
                          <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase italic">{format(new Date(notif.date), 'dd MMM yyyy HH:mm')}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => { setShowNotif(false); navigate('/berita'); }}
                  className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase italic text-slate-600 shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={14} />
                  Lihat Pusat Berita
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


