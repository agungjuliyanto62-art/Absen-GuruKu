import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Edit,
  TrendingUp, 
  Search,
  Bell,
  LogOut,
  ArrowRight,
  User as UserIcon,
  ChevronRight,
  Activity,
  Hourglass,
  MoreVertical,
  ShieldCheck,
  RefreshCw,
  MapPin,
  Map,
  Camera,
  Megaphone,
  Newspaper,
  BookOpen,
  School,
  Settings as SettingsIcon,
  Trash2,
  Plus,
  Save,
  Youtube,
  Gamepad2,
  MessageSquare,
  Eye,
  Key,
  Smartphone,
  EyeOff,
  UserPlus,
  Briefcase,
  Book,
  History,
  LayoutDashboard,
  Info,
  FileSpreadsheet,
  FileDown,
  PieChart as PieChartIcon,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  AreaChart, 
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User, LearningMedia, NewsItem, SchoolSettings, SchoolProfile } from '../types';

import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
});

type AdminView = 'hub' | 'teachers' | 'attendance' | 'requests' | 'activities' | 'news' | 'media' | 'profile' | 'settings';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { 
    user, logout, users, attendanceData, leaveRequests, overtimeRequests,
    activities, posts, news, learningMedia, settings, schoolProfile,
    updateLeaveStatus, updateOvertimeStatus, updateActivityStatus,
    addUser, updateUser, deleteUser, addNews, deleteNews, addMedia,
    deleteMedia, updateSchoolProfile, updateSettings, deletePost,
    deleteActivity
  } = useApp();

  const [activeView, setActiveView] = useState<AdminView>('hub');
  const [isMobileMode, setIsMobileMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddNews, setShowAddNews] = useState(false);
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const stats = useMemo(() => {
    const totalTeachers = users.filter(u => u.role === 'teacher').length;
    const presentToday = attendanceData.filter(a => a.date === format(new Date(), 'yyyy-MM-dd')).length;
    const weekDays = eachDayOfInterval({
      start: startOfWeek(new Date(), { weekStartsOn: 1 }),
      end: endOfWeek(new Date(), { weekStartsOn: 1 })
    });
    const attendanceChart = weekDays.map(day => ({
      name: format(day, 'EEE', { locale: id }),
      count: attendanceData.filter(a => a.date === format(day, 'yyyy-MM-dd')).length
    }));
    return { totalTeachers, presentToday, attendanceChart };
  }, [users, attendanceData]);

  const pendingRequestsCount = useMemo(() => {
    return leaveRequests.filter(l => l.status === 'pending').length + 
           overtimeRequests.filter(o => o.status === 'pending').length;
  }, [leaveRequests, overtimeRequests]);

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

  if (user?.role !== 'admin') return <AccessDenied onBack={() => navigate('/')} />;

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
                'Terima kasih telah bergabung. Status lisensi sekolah Anda saat ini sedang dikonfigurasi & diverifikasi oleh pihak Super Admin. Seluruh fitur administrasi sekolah akan otomatis diaktifkan setelah verifikasi berkas selesai.'
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
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden text-slate-800">
      <header className="bg-white px-6 py-6 border-b border-slate-100 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          {activeView !== 'hub' && (
            <button onClick={() => setActiveView('hub')} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 mr-1">
              <LayoutDashboard size={20} />
            </button>
          )}
          <div>
             <h1 className="text-lg font-black italic tracking-tight leading-none uppercase">
               {activeView === 'hub' ? 'Admin Hub' : activeView.replace(/([A-Z])/g, ' $1').trim()}
             </h1>
             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1">Sistem Administrasi AbsenKu</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative">
          <div className="flex bg-slate-100 p-1 rounded-2xl mr-1">
            <button 
              onClick={() => setIsMobileMode(true)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase transition-all ${isMobileMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
            >
              <Smartphone size={12} />
              <span className="hidden xs:inline">Mobile</span>
            </button>
            <button 
              onClick={() => setIsMobileMode(false)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase transition-all ${!isMobileMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
            >
              <LayoutDashboard size={12} />
              <span className="hidden xs:inline">Desktop</span>
            </button>
          </div>

          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-100 relative"
          >
            <Bell size={18} />
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                {pendingRequestsCount}
              </span>
            )}
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100">
            <LogOut size={18} />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-14 right-0 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                >
                  <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase italic tracking-widest text-slate-800">Notifikasi Pengajuan</h3>
                    <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full">{pendingRequestsCount} Baru</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
                    {pendingRequestsCount === 0 ? (
                      <div className="p-10 text-center">
                        <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
                        <p className="text-[10px] font-black uppercase text-slate-400 italic">Semua Beres!</p>
                      </div>
                    ) : (
                      <>
                        {leaveRequests.filter(l => l.status === 'pending').map(req => {
                          const u = users.find(x => x.id === req.userId);
                          return (
                            <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setActiveView('requests'); setShowNotifications(false); }}>
                               <div className="flex gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                     <FileText size={16} />
                                  </div>
                                  <div>
                                     <h4 className="text-[11px] font-black text-slate-800 uppercase">{u?.name}</h4>
                                     <p className="text-[9px] font-medium text-slate-500 mt-0.5 line-clamp-1 italic">Izin: {req.reason}</p>
                                     <p className="text-[8px] font-black text-indigo-500 mt-1 uppercase italic">{req.startDate}</p>
                                  </div>
                               </div>
                            </div>
                          );
                        })}
                        {overtimeRequests.filter(o => o.status === 'pending').map(req => {
                          const u = users.find(x => x.id === req.userId);
                          return (
                            <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setActiveView('requests'); setShowNotifications(false); }}>
                               <div className="flex gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                     <Clock size={16} />
                                  </div>
                                  <div>
                                     <h4 className="text-[11px] font-black text-slate-800 uppercase">{u?.name}</h4>
                                     <p className="text-[9px] font-medium text-slate-500 mt-0.5 line-clamp-1 italic">Lembur: {req.reason}</p>
                                     <p className="text-[8px] font-black text-indigo-500 mt-1 uppercase italic">{req.date}</p>
                                  </div>
                               </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                  <button 
                    onClick={() => { setActiveView('requests'); setShowNotifications(false); }}
                    className="w-full p-4 text-[9px] font-black text-indigo-600 uppercase italic tracking-widest border-t border-slate-50 hover:bg-indigo-50 transition-colors"
                  >
                    Lihat Semua Pengajuan
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto pt-6 pb-24 scrollbar-hide transition-all duration-500 ease-in-out ${isMobileMode ? 'max-w-[420px] mx-auto w-full px-6' : 'max-w-7xl mx-auto w-full px-8'}`}>
        <AnimatePresence mode="wait">
          {activeView === 'hub' && <HubView key="hub" stats={stats} users={users} attendance={attendanceData} onNavigate={setActiveView} schoolProfile={schoolProfile} counts={{
            requests: leaveRequests.filter(l => l.status === 'pending').length + overtimeRequests.filter(o => o.status === 'pending').length,
            activities: activities.filter(a => a.status === 'pending').length
          }} />}
          {activeView === 'teachers' && (
            <TeachersView 
              users={users} 
              onDelete={deleteUser} 
              onUpdateStatus={(u: User, s: 'active' | 'inactive') => updateUser({...u, status: s})}
              onAdd={() => setShowAddUser(true)} 
              onEdit={(u: User) => setEditingUser(u)}
              searchTerm={searchTerm} 
              onSearch={setSearchTerm}
              schoolProfile={schoolProfile}
            />
          )}
          {activeView === 'settings' && (
            <SettingsView 
              settings={settings} 
              onUpdate={updateSettings} 
              schoolProfile={schoolProfile} 
              updateSchoolProfile={updateSchoolProfile}
              currentUser={user}
              updateUser={updateUser}
            />
          )}
          {activeView === 'news' && <NewsView news={news} onAdd={() => setShowAddNews(true)} onDelete={deleteNews} />}
          {activeView === 'requests' && <RequestsView leaveRequests={leaveRequests} overtimeRequests={overtimeRequests} onUpdateLeave={updateLeaveStatus} onUpdateOvertime={updateOvertimeStatus} users={users} />}
          {activeView === 'media' && <MediaView media={learningMedia} onAdd={() => setShowAddMedia(true)} onDelete={deleteMedia} />}
          {activeView === 'profile' && <ProfileView profile={schoolProfile} onUpdate={updateSchoolProfile} />}
          {activeView === 'activities' && <ActivityView posts={posts} users={users} onDeletePost={deletePost} activities={activities} onUpdateActivity={updateActivityStatus} />}
          {activeView === 'attendance' && <AttendanceRecap users={users} attendance={attendanceData} activities={activities} onDeleteActivity={deleteActivity} schoolProfile={schoolProfile} />}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showAddUser && <Modal onClose={() => setShowAddUser(false)} title="Tambah Guru baru"><UserForm onSubmit={async (d: any) => { await addUser({...d, role:'teacher', status:'active', location: settings.center as any}); setShowAddUser(false); }} /></Modal>}
        {editingUser && <Modal onClose={() => setEditingUser(null)} title="Edit Data Guru"><UserForm initialData={editingUser} onSubmit={async (d: any) => { await updateUser({ ...editingUser, ...d }); setEditingUser(null); }} /></Modal>}
        {showAddNews && (
          <Modal onClose={() => setShowAddNews(false)} title="Buat Berita / Pengumuman">
            <NewsForm onSubmit={(d: any) => { 
              addNews({
                ...d, 
                date: format(new Date(), 'dd MMM yyyy')
              }); 
              setShowAddNews(false); 
            }} />
          </Modal>
        )}
        {showAddMedia && <Modal onClose={() => setShowAddMedia(false)} title="Tambah Media"><MediaForm onSubmit={(d) => { addMedia({...d, date: format(new Date(), 'dd/MM/yyyy'), addedBy:'Admin', category:'UMUM'}); setShowAddMedia(false); }} /></Modal>}
      </AnimatePresence>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-white/90 shadow-2xl rounded-full px-6 py-4 flex gap-5 items-center border border-slate-100 backdrop-blur-xl">
           {[
             { id: 'hub', icon: <LayoutDashboard size={22} /> },
             { id: 'teachers', icon: <Users size={22} /> },
             { id: 'activities', icon: <Activity size={22} /> },
             { id: 'settings', icon: <SettingsIcon size={22} /> }
           ].map(item => (
             <button key={item.id} onClick={() => setActiveView(item.id as any)} className={`transition-all ${activeView === item.id ? 'text-indigo-600 scale-125' : 'text-slate-300'}`}>
                {item.icon}
             </button>
           ))}
        </div>
      </div>
    </div>
  );
}

// Sub-components as local functions to keep it clean and professional
function HubView({ stats, onNavigate, counts, users, attendance, schoolProfile }: any) {
  const teacherUsers = users.filter((u: any) => u.role === 'teacher');
  const totalTeachers = teacherUsers.length;
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const todayAttendance = attendance.filter((a: any) => a.date === today);
  const presentCount = todayAttendance.length;
  const absentCount = totalTeachers - presentCount;

  // Active subscription lookup state
  const [activeSub, setActiveSub] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sa_packages');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        const currentSchoolName = schoolProfile?.name || 'SMP Negeri 1 Banjar Margo';
        // Match the subscription from school name
        const found = list.find((p: any) => 
          p.name?.toLowerCase().includes("tulang bawang") || 
          p.name?.toLowerCase().includes("smpn") ||
          p.name?.toLowerCase().includes(currentSchoolName.toLowerCase()) ||
          currentSchoolName.toLowerCase().includes(p.name?.toLowerCase())
        ) || list[0]; // fallback to first package if not found

        if (found) {
          setActiveSub(found);
        }
      } catch (e) {
        // fail silently
      }
    }
  }, [schoolProfile]);

  const attendanceData = [
    { name: 'Hadir', value: presentCount, color: '#10b981' },
    { name: 'Belum Absen', value: absentCount, color: '#f43f5e' },
  ];

  const attendanceList = teacherUsers.map((teacher: any) => {
    const record = todayAttendance.find((a: any) => a.userId === teacher.id);
    return {
      ...teacher,
      isPresent: !!record,
      checkInTime: record?.checkInTime || '-'
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -15 }} 
      className="space-y-8"
    >
      {/* Dynamic Subscription Notice Banner */}
      {activeSub && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-900 to-indigo-950 border border-indigo-700/30 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="flex gap-4 items-start relative z-10">
            <div className="w-12 h-12 bg-white/10 text-indigo-300 rounded-2xl flex items-center justify-center shrink-0">
              <Bell size={22} className="animate-bounce" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full uppercase font-black tracking-wider border border-indigo-500/30">
                  Informasi Lisensi {activeSub.duration === 'free_trial' ? 'Free Trial' : 'Kemitraan'}
                </span>
                <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full uppercase font-black">
                  Aktif
                </span>
              </div>
              <h4 className="text-sm font-black italic tracking-wide text-white mt-1">STATUS BERLANGGANAN AKTIF - {schoolProfile?.name || activeSub.name}</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                Sistem mendeteksi bahwa sekolah Anda sedang aktif menggunakan layanan <span className="text-white font-extrabold">{activeSub.duration === 'free_trial' ? 'Free Trial (Gratis)' : `Paket ${activeSub.duration}`}</span>. Lisensi ini terdaftar resmi dan berlaku s/d <span className="text-indigo-300 font-extrabold">{activeSub.endDate}</span>.
              </p>
              <div className="flex items-center gap-6 mt-1 text-[10px] text-indigo-300 font-bold">
                <span>💰 Status: <span className="text-emerald-400 font-black">Aktif / Lunas</span></span>
                <span>📅 Kadaluarsa: <span className="text-white font-black">{activeSub.endDate}</span></span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Attendance Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doughnut Chart */}
        <motion.div 
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center"
        >
          <h3 className="text-[11px] font-black uppercase text-slate-800 italic mb-6 flex items-center gap-2 self-start">
             <PieChartIcon size={16} className="text-indigo-500" />
             Analisis Kehadiran Hari Ini
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {attendanceData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '10px',
                    fontWeight: '900',
                    textTransform: 'uppercase'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            {attendanceData.map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-[9px] font-black uppercase text-slate-500">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Real-time Presence List */}
        <motion.div 
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col"
        >
          <div className="p-6 pb-2">
            <h3 className="text-[11px] font-black uppercase text-slate-800 italic flex items-center gap-2">
               <Activity size={16} className="text-indigo-500" />
               Detail Kehadiran ({format(new Date(), 'dd MMMM yyyy', { locale: id })})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[250px] p-4 pt-0">
            <div className="space-y-2">
              {attendanceList.map((item: any) => (
                <motion.div 
                  key={item.id} 
                  whileHover={{ x: 5, backgroundColor: '#f8fafc' }}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] ${item.isPresent ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-800">{item.name}</p>
                      <p className="text-[9px] font-bold text-slate-400">NIP: {item.employeeId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    {item.isPresent ? (
                      <div>
                        <p className="text-[9px] font-black text-emerald-600 uppercase italic">Hadir</p>
                        <p className="text-[8px] font-bold text-slate-400">{item.checkInTime}</p>
                      </div>
                    ) : (
                      <p className="text-[9px] font-black text-rose-500 uppercase italic tracking-tighter">Belum Absen</p>
                    )}
                    <div className={`w-2 h-2 rounded-full ${item.isPresent ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.section 
        whileHover={{ scale: 1.01 }}
        className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm"
      >
        <div className="h-48 w-full mb-6">
          <ResponsiveContainer>
            <AreaChart data={stats.attendanceChart}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                  fontSize: '10px', 
                  fontWeight: 800 
                }} 
              />
              <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-indigo-600 p-5 rounded-3xl text-white shadow-lg shadow-indigo-200">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Hadir Hari Ini</p>
            <h3 className="text-3xl font-black italic">{stats.presentToday}</h3>
          </div>
          <div className="bg-slate-800 p-5 rounded-3xl text-white shadow-lg shadow-slate-200">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Total Guru</p>
            <h3 className="text-3xl font-black italic">{stats.totalTeachers}</h3>
          </div>
        </div>
      </motion.section>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Manajemen Guru', id: 'teachers', icon: <Users />, color: 'bg-blue-500' },
          { label: 'Monitoring Aktivitas', id: 'activities', icon: <Activity />, color: 'bg-rose-500', badge: counts.activities },
          { label: 'Approval Izin', id: 'requests', icon: <FileText />, color: 'bg-amber-500', badge: counts.requests },
          { label: 'Rekap Absensi', id: 'attendance', icon: <History />, color: 'bg-green-500' },
          { label: 'Pusat Berita', id: 'news', icon: <Megaphone />, color: 'bg-slate-800' },
          { label: 'Media Belajar', id: 'media', icon: <BookOpen />, color: 'bg-violet-500' },
          { label: 'Profil Sekolah', id: 'profile', icon: <School />, color: 'bg-teal-500' },
          { label: 'Pengaturan', id: 'settings', icon: <SettingsIcon />, color: 'bg-slate-400' }
        ].map(btn => (
          <motion.button 
            key={btn.id} 
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate(btn.id)} 
            className={`${btn.color} p-6 rounded-[2.2rem] text-white flex flex-col items-center gap-2 shadow-xl relative transition-all`}
          >
            <div className="bg-white/20 p-3 rounded-2xl shadow-inner">{btn.icon}</div>
            <span className="text-[10px] font-black uppercase tracking-widest italic text-center leading-tight">{btn.label}</span>
            {btn.badge > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-[10px] border-2 border-white font-black"
              >
                {btn.badge}
              </motion.span>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function SettingsView({ settings, onUpdate, schoolProfile, updateSchoolProfile, currentUser, updateUser }: any) {
  const [isLocating, setIsLocating] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  
  const [schoolName, setSchoolName] = useState(schoolProfile?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [waNumber, setWaNumber] = useState(settings?.whatsappNumber || '');
  const [waTemplate, setWaTemplate] = useState(settings?.whatsappTemplate || '');
  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);

  useEffect(() => {
    if (settings) {
      setWaNumber(settings.whatsappNumber || '');
      setWaTemplate(settings.whatsappTemplate || '');
    }
  }, [settings?.whatsappNumber, settings?.whatsappTemplate]);

  const handleUpdateWhatsApp = async () => {
    setIsSavingWhatsapp(true);
    const sanitizedNumber = waNumber.replace(/[^0-9]/g, '');
    await onUpdate({
      whatsappNumber: sanitizedNumber,
      whatsappTemplate: waTemplate
    });
    setIsSavingWhatsapp(false);
    alert('Konfigurasi WhatsApp Atasan berhasil disimpan!');
  };

  const handleDeleteWhatsApp = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus/menonaktifkan integrasi nomor WhatsApp atasan?')) {
      setIsSavingWhatsapp(true);
      setWaNumber('');
      setWaTemplate('Halo Atasan, saya [Nama] mengajukan izin [Jenis] dari tanggal [TanggalMulai] s/d [TanggalSelesai] dengan alasan: [Alasan]. Terima kasih.');
      await onUpdate({
        whatsappNumber: '',
        whatsappTemplate: 'Halo Atasan, saya [Nama] mengajukan izin [Jenis] dari tanggal [TanggalMulai] s/d [TanggalSelesai] dengan alasan: [Alasan]. Terima kasih.'
      });
      setIsSavingWhatsapp(false);
      alert('Integrasi WhatsApp dinonaktifkan.');
    }
  };

  const handleUpdateSchoolName = async () => {
    setIsSavingProfile(true);
    await updateSchoolProfile({ ...schoolProfile, name: schoolName });
    setIsSavingProfile(false);
    alert('Nama sekolah berhasil diperbarui!');
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      alert('Password baru tidak boleh kosong!');
      return;
    }
    setIsSavingPassword(true);
    await updateUser({ ...currentUser, password: newPassword });
    setIsSavingPassword(false);
    setNewPassword('');
    alert('Password admin berhasil diperbarui!');
  };

  function LocationMarker() {
    const map = useMapEvents({
      click(e) {
        onUpdate({ center: { lat: e.latlng.lat, lng: e.latlng.lng } });
      },
    });

    useEffect(() => {
      if (settings.center && map) {
        map.flyTo([settings.center.lat, settings.center.lng], map.getZoom(), {
          animate: true,
          duration: 1.5
        });
      }
    }, [settings.center, map]);

    return settings.center ? (
      <>
        <Marker position={[settings.center.lat, settings.center.lng]} />
        <Circle 
          center={[settings.center.lat, settings.center.lng]} 
          radius={settings.radius}
          pathOptions={{ fillColor: '#4f46e5', fillOpacity: 0.2, color: '#4f46e5' }}
        />
      </>
    ) : null;
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung geolokasi.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition((position) => {
      const newCenter = { 
        lat: position.coords.latitude, 
        lng: position.coords.longitude 
      };
      
      onUpdate({ center: newCenter });
      setIsLocating(false);
      
      if (mapInstance) {
        mapInstance.flyTo([newCenter.lat, newCenter.lng], 17, {
          duration: 2
        });
      }
    }, (err) => {
      setIsLocating(false);
      let msg = "Gagal mendapatkan lokasi.";
      if (err.code === 1) msg = "Izin lokasi ditolak.";
      else if (err.code === 2) msg = "Sinyal GPS tidak ditemukan.";
      else if (err.code === 3) msg = "Waktu permintaan habis.";
      alert(msg);
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const setCenterFromMap = () => {
    if (mapInstance) {
      const center = mapInstance.getCenter();
      onUpdate({ center: { lat: center.lat, lng: center.lng } });
    }
  };

  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefreshMap = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 pb-20">
      <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 overflow-hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-black italic uppercase flex items-center gap-2">
             <MapPin size={16} className="text-indigo-500" />
             Konfigurasi Lokasi & Radius
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={handleRefreshMap}
              className="bg-slate-50 text-slate-600 p-2 rounded-xl border border-slate-200 flex items-center gap-2 text-[10px] font-black uppercase italic hover:bg-slate-100 transition-colors"
              title="Refresh Map View"
            >
              <RefreshCw size={14} className={refreshKey > 0 ? '' : ''} />
              Re-center
            </button>
            <button 
              onClick={setCenterFromMap}
              className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-100 flex items-center gap-2 text-[10px] font-black uppercase italic hover:bg-emerald-100 transition-colors"
            >
              <Map size={14} />
              Gunakan Tengah Peta
            </button>
            <button 
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="bg-indigo-50 text-indigo-600 p-2 rounded-xl border border-indigo-100 flex items-center gap-2 text-[10px] font-black uppercase italic hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              {isLocating ? <RefreshCw size={14} className="animate-spin" /> : <Smartphone size={14} />}
              {isLocating ? 'Mencari...' : 'Ambil Lokasi Saya'}
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
           <Input 
             label="Nama Lokasi Sekolah" 
             value={settings.locationName} 
             onChange={(v:string) => onUpdate({ locationName: v })} 
             placeholder="Contoh: Kampus Pusat SMPN"
           />
           
           <div className="space-y-2">
             <label className="text-[9px] font-black uppercase text-slate-400 italic">Radius Absensi (Meter)</label>
             <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="10" 
                  max="1000" 
                  step="10" 
                  value={settings.radius} 
                  onChange={(e) => onUpdate({ radius: parseInt(e.target.value) })} 
                  className="flex-1 accent-indigo-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" 
                />
                <span className="bg-indigo-600 text-white font-black px-4 py-1.5 rounded-xl text-xs italic min-w-[60px] text-center shadow-lg shadow-indigo-200">
                  {settings.radius}m
                </span>
             </div>
           </div>

           <div className="rounded-3xl overflow-hidden border border-slate-100 relative group">
              <div className="h-72 w-full z-0">
                <MapContainer 
                  key={refreshKey}
                  center={[settings.center.lat, settings.center.lng]} 
                  zoom={16} 
                  scrollWheelZoom={false} 
                  style={{ height: '100%', width: '100%' }}
                  ref={setMapInstance}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker />
                </MapContainer>
              </div>
              <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-100 pointer-events-none">
                 <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600 italic">💡 Klik di peta atau geser lalu klik 'Gunakan Tengah Peta'</p>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none opacity-30">
                 <MapPin size={24} className="text-slate-400" />
              </div>
           </div>

           <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Info size={16} />
              </div>
              <p className="text-[9px] font-medium text-slate-500 leading-tight">
                Guru hanya dapat melakukan absensi jika berada di dalam radius <span className="font-bold text-slate-800">{settings.radius} meter</span> dari titik pusat koordinat di atas.
              </p>
           </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-sm font-black italic uppercase flex items-center gap-2">
           <Clock size={16} className="text-indigo-500" />
           Waktu Operasional
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Mulai Absen Masuk" type="time" value={settings.workHours.entryStart} onChange={(v:string) => onUpdate({ workHours: {...settings.workHours, entryStart: v } })} />
          <Input label="Selesai Absen Masuk" type="time" value={settings.workHours.entryEnd} onChange={(v:string) => onUpdate({ workHours: {...settings.workHours, entryEnd: v } })} />
          <Input label="Mulai Absen Pulang" type="time" value={settings.workHours.exitStart} onChange={(v:string) => onUpdate({ workHours: {...settings.workHours, exitStart: v } })} />
          <Input label="Selesai Absen Pulang" type="time" value={settings.workHours.exitEnd} onChange={(v:string) => onUpdate({ workHours: {...settings.workHours, exitEnd: v } })} />
        </div>
      </section>

      <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4 text-center pb-8 pt-6">
        <div className="w-12 h-12 bg-indigo-50 flex items-center justify-center rounded-2xl text-indigo-600 mx-auto mb-4">
           <Save size={24} />
        </div>
        <h4 className="text-sm font-black uppercase italic italic text-slate-800">Semua Perubahan Tersimpan</h4>
        <p className="text-[10px] font-medium text-slate-400">Pengaturan radius dan lokasi diperbarui secara otomatis ke semua perangkat guru.</p>
      </section>

      <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-sm font-black italic uppercase">Pesan Running Text</h3>
        <textarea value={settings.runningText} onChange={(e) => onUpdate({ runningText: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-black italic focus:outline-none" rows={3} />
      </section>

      <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
            <School size={20} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-800">Nama Sekolah</h3>
            <p className="text-[8px] font-black uppercase text-slate-400">Ubah nama yang tampil di Login</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 italic">Nama Sekolah Baru</label>
            <input 
              type="text" 
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Masukkan nama sekolah..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button 
            onClick={handleUpdateSchoolName}
            disabled={isSavingProfile}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSavingProfile ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            Simpan Nama Sekolah
          </button>
        </div>
      </section>

      {/* INTEGRASI WHATSAPP ATASAN */}
      <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-800">Integrasi WA Atasan</h3>
              <p className="text-[8px] font-black uppercase text-slate-400">Hubungkan Permohonan Izin Guru ke WhatsApp Atasan</p>
            </div>
          </div>
          {settings?.whatsappNumber && (
            <span className="text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 animate-pulse">
              Aktif
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 italic">No WhatsApp Atasan / Kepala Sekolah</label>
            <input 
              type="text" 
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              placeholder="Contoh: 628123456789"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="text-[8px] text-slate-400 italic leading-none mt-1">
              *Masukkan nomor lengkap dengan kode negara tanpa spasi atau lambang tambah (+). Contoh: <b>628123456789</b>.
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black uppercase text-slate-400 italic">Format Teks Pesan Izin</label>
              <span className="text-[8px] font-black text-indigo-500 uppercase tracking-tight italic">Klik Badge untuk Menyisipkan</span>
            </div>
            
            <textarea 
              value={waTemplate}
              onChange={(e) => setWaTemplate(e.target.value)}
              className="w-full bg-slate-50 border border-[#e2e8f0] rounded-2xl p-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              rows={4}
              placeholder="Format template pesan WhatsApp..."
            />

            {/* Quick Action Placeholders badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { label: '[Nama]', tip: 'Nama Guru' },
                { label: '[Jenis]', tip: 'Jenis Izin (Sakit/Izin/Cuti)' },
                { label: '[TanggalMulai]', tip: 'Tgl Mulai' },
                { label: '[TanggalSelesai]', tip: 'Tgl Selesai' },
                { label: '[Alasan]', tip: 'Alasan Izin' }
              ].map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => setWaTemplate(prev => prev + ' ' + tag.label + ' ')}
                  className="px-2.5 py-1 text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg border border-slate-200 hover:border-indigo-100 transition-all active:scale-95"
                  title={tag.tip}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* LIVE PREVIEW BOX */}
          <div className="border border-slate-100 bg-slate-50 rounded-3xl p-4 space-y-2">
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest italic">Live Preview Pesan WhatsApp :</span>
            <div className="bg-[#DCF8C6] border border-[#C7EDB4] rounded-2xl p-3 shadow-sm text-xs text-slate-800 leading-normal max-w-sm relative">
              <p className="whitespace-pre-wrap font-medium text-[11px] pb-2">
                {waTemplate
                  ? waTemplate
                      .replace(/\[Nama\]/g, 'Budi Gunawan, S.Pd.')
                      .replace(/\[Jenis\]/g, 'Izin Sakit')
                      .replace(/\[TanggalMulai\]/g, '26 Mei 2026')
                      .replace(/\[TanggalSelesai\]/g, '27 Mei 2026')
                      .replace(/\[Alasan\]/g, 'Demam panas tinggi & disarankan dokter istirahat')
                  : 'Mohon isi format pesan di atas...'}
              </p>
              <div className="absolute right-2 bottom-1 flex items-center gap-1">
                <span className="text-[8px] text-slate-400">10:00</span>
                <span className="text-emerald-600 text-[10px] font-bold">✓✓</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleDeleteWhatsApp}
              disabled={isSavingWhatsapp}
              className="py-3.5 bg-rose-50 text-rose-600 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              Hapus Integrasi
            </button>
            <button
              onClick={handleUpdateWhatsApp}
              disabled={isSavingWhatsapp}
              className="py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 shrink-0"
            >
              {isSavingWhatsapp ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              Simpan WhatsApp
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
            <Key size={20} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-800">Keamanan Admin</h3>
            <p className="text-[8px] font-black uppercase text-slate-400">Ganti Password Administrator</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 italic">Password Baru</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>
          <button 
            onClick={handleUpdatePassword}
            disabled={isSavingPassword}
            className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSavingPassword ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            Update Password Admin
          </button>
        </div>
      </section>
    </motion.div>
  );
}

function TeachersView({ users, onDelete, onUpdateStatus, onAdd, onEdit, searchTerm, onSearch, schoolProfile }: any) {
  const filteredUsers = useMemo(() => {
    return users.filter((u: any) => 
      u.role === 'teacher' && 
      (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       u.employeeId.includes(searchTerm))
    );
  }, [users, searchTerm]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const schoolName = schoolProfile?.name || 'SEKOLAH KAMI';
    
    // Header styling
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolName.toUpperCase(), 105, 18, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const address = schoolProfile?.address || 'Alamat Sekolah Belum Diatur';
    doc.text(address, 105, 25, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DATA GURU & STAFF', 105, 34, { align: 'center' });

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.text(`Tanggal Cetak: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}`, 14, 48);

    const tableRows = filteredUsers.map((u: any, index: number) => [
      (index + 1).toString(),
      u.name.toUpperCase(),
      u.employeeId,
      (u.position || 'GURU').toUpperCase(),
      (u.subject || '-').toUpperCase(),
      u.status === 'active' ? 'AKTIF' : 'NON-AKTIF'
    ]);

    autoTable(doc, {
      startY: 52,
      head: [['NO', 'NAMA LENGKAP', 'NIP/NUPTK', 'JABATAN', 'MATA PELAJARAN', 'STATUS']],
      body: tableRows,
      theme: 'striped',
      headStyles: { 
        fillColor: [79, 70, 229], 
        textColor: [255, 255, 255],
        fontSize: 8, 
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: { 
        fontSize: 8,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        2: { halign: 'center' },
        5: { halign: 'center' }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      styles: { 
        font: 'helvetica',
        cellPadding: 3
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Halaman ${i} dari ${pageCount}`, 105, 285, { align: 'center' });
      doc.text('Dicetak otomatis melalui Aplikasi Absensi', 105, 290, { align: 'center' });
    }

    doc.save(`Data_Guru_${schoolName.replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center bg-white p-2 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex-1 flex items-center gap-3 pl-4">
             <Search size={18} className="text-slate-300" />
             <input placeholder="Cari Guru..." value={searchTerm} onChange={(e) => onSearch(e.target.value)} className="bg-transparent focus:outline-none text-xs font-black w-full uppercase" />
          </div>
          <button onClick={onAdd} className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg"><Plus size={20} /></button>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={handleDownloadPDF}
             className="flex-1 bg-rose-50 text-rose-600 py-3 rounded-2xl border border-rose-100 flex items-center justify-center gap-2 text-[10px] font-black uppercase italic hover:bg-rose-100 transition-colors"
           >
             <FileDown size={14} />
             Download PDF
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden divide-y divide-slate-50">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
             <p className="text-[10px] font-black uppercase italic tracking-widest">Tidak ada data guru ditemukan</p>
          </div>
        ) : (
          filteredUsers.map((u:any) => (
            <div key={u.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black">{u.name.charAt(0)}</div>
                 <div>
                    <h4 className="text-[11px] font-black uppercase text-slate-800">{u.name}</h4>
                    <p className="text-[9px] font-black text-slate-400">NIP: {u.employeeId} • {u.position || 'GURU'}</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onUpdateStatus(u, u.status === 'active' ? 'inactive' : 'active')}
                  className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase italic border transition-all ${
                    u.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                      : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  {u.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                </button>
                <button onClick={() => onEdit(u)} className="text-slate-400 p-2 hover:text-indigo-600 transition-colors"><Edit size={16} /></button>
                <button onClick={() => onDelete(u.id)} className="text-rose-400 p-2 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

// Minimal helpers
function Input({ label, onChange, ...props }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black uppercase text-slate-400 italic">{label}</label>
      <input 
        {...props} 
        onChange={(e) => onChange && onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-black focus:outline-none border-b-2 focus:border-b-indigo-600" 
      />
    </div>
  );
}

function Modal({ children, onClose, title }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl">
         <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xs font-black uppercase italic tracking-widest">{title}</h3>
            <button onClick={onClose}><XCircle size={20} className="text-slate-300" /></button>
         </div>
         <div className="p-8 max-h-[60vh] overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  );
}

function UserForm({ onSubmit, initialData }: any) {
  const [data, setData] = useState({ 
    name: initialData?.name || '', 
    employeeId: initialData?.employeeId || '', 
    position: initialData?.position || '', 
    subject: initialData?.subject || '', 
    password: initialData?.password || '123' 
  });
  return <div className="space-y-4">
    <Input label="Nama Lengkap" value={data.name} onChange={(v:any) => setData({...data, name: v})} />
    <Input label="NIP / NUPTK" value={data.employeeId} onChange={(v:any) => setData({...data, employeeId: v})} />
    <Input label="Jabatan" value={data.position} onChange={(v:any) => setData({...data, position: v})} />
    <Input label="Mata Pelajaran" value={data.subject} onChange={(v:any) => setData({...data, subject: v})} />
    <Input label="Password Login" value={data.password} onChange={(v:any) => setData({...data, password: v})} />
    <button onClick={() => onSubmit(data)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg mt-2">
      {initialData ? 'Update Data Guru' : 'Simpan Guru'}
    </button>
  </div>;
}

function NewsForm({ onSubmit }: any) {
  const [data, setData] = useState({ title: '', content: '', category: 'BERITA', image: '' });
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        setData({ ...data, image: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  return <div className="space-y-4">
    <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
      {['BERITA', 'PENGUMUMAN'].map(cat => (
        <button 
          key={cat} 
          onClick={() => setData({...data, category: cat})}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${data.category === cat ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
        >
          {cat === 'BERITA' ? 'Tulis Berita' : 'Tulis Pengumuman'}
        </button>
      ))}
    </div>
    <Input label="Judul" value={data.title} onChange={(v:any) => setData({...data, title: v})} />
    
    <div className="space-y-1">
      <label className="text-[9px] font-black uppercase text-slate-400 italic">Foto Lampiran (Opsional)</label>
      <div className="flex flex-col gap-3">
        {data.image && (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-100">
             <img src={data.image} className="w-full h-full object-cover" alt="Preview" />
             <button onClick={() => { setData({...data, image: ''}); setPreview(null); }} className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-lg">
                <Trash2 size={14} />
             </button>
          </div>
        )}
        <label className="w-full h-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
          <Camera size={18} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase text-slate-500">Upload Gambar</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </label>
      </div>
    </div>

    <textarea placeholder="Isi Berita/Pengumuman..." value={data.content} onChange={(e) => setData({...data, content: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl text-xs font-black italic focus:outline-none" rows={5} />
    <button onClick={() => onSubmit(data)} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg mt-2">Publish {data.category}</button>
  </div>;
}

function MediaForm({ onSubmit }: any) {
  const [data, setData] = useState({ 
    title: '', 
    url: '', 
    category: 'RUANG_GURU',
    description: ''
  });

  const categories = [
    { id: 'RUANG_GURU', label: 'Ruang Guru Nasional' },
    { id: 'GAME', label: 'Game Pembelajaran' },
    { id: 'YOUTUBE', label: 'Youtube' }
  ];

  return <div className="space-y-4">
    <div className="grid grid-cols-1 gap-2 p-1 bg-slate-100 rounded-2xl">
      {categories.map(cat => (
        <button 
          key={cat.id} 
          onClick={() => setData({...data, category: cat.id})}
          className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${data.category === cat.id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
        >
          {cat.label}
        </button>
      ))}
    </div>
    <Input label="Judul Media" value={data.title} onChange={(v:any) => setData({...data, title: v})} />
    <Input label="Link URL (https://...)" value={data.url} onChange={(v:any) => setData({...data, url: v})} />
    <textarea 
      placeholder="Deskripsi singkat..." 
      value={data.description} 
      onChange={(e) => setData({...data, description: e.target.value})} 
      className="w-full bg-slate-50 p-4 rounded-xl text-xs font-black italic focus:outline-none" 
      rows={3} 
    />
    <button onClick={() => onSubmit(data)} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg mt-2">Simpan Media</button>
  </div>;
}

function NewsView({ news, onDelete, onAdd }: any) {
  return <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} className="space-y-4 pb-20">
    <div className="grid grid-cols-2 gap-3 mb-2">
       <button onClick={onAdd} className="bg-slate-800 text-white p-4 rounded-3xl flex flex-col items-center gap-2 shadow-xl">
          <Newspaper size={20} />
          <span className="text-[9px] font-black uppercase italic tracking-widest leading-tight">Tulis Berita</span>
       </button>
       <button onClick={onAdd} className="bg-amber-500 text-white p-4 rounded-3xl flex flex-col items-center gap-2 shadow-xl">
          <Megaphone size={20} />
          <span className="text-[9px] font-black uppercase italic tracking-widest leading-tight">Tulis Pengumuman</span>
       </button>
    </div>
    <div className="space-y-4">
      {news.sort((a:any, b:any) => b.id.localeCompare(a.id)).map((item:any) => {
        const isP = item.category === 'PENGUMUMAN';
        return (
          <div key={item.id} className={`${isP ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100'} p-5 rounded-[2.5rem] border shadow-sm`}>
             {item.image && <img src={item.image} className="w-full aspect-video object-cover rounded-[1.5rem] mb-4 shadow-sm" alt="News" />}
             <div className="flex justify-between items-start">
               <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-black uppercase italic ${isP ? 'text-amber-600' : 'text-indigo-500'}`}>{item.category}</span>
                    <span className="text-[8px] font-bold text-slate-400">{item.date}</span>
                  </div>
                  <h4 className="text-[12px] font-black uppercase text-slate-800 leading-tight">{item.title}</h4>
                  <p className="text-[10px] font-medium text-slate-500 mt-2 line-clamp-3 italic">"{item.content}"</p>
               </div>
               <button onClick={() => onDelete(item.id)} className="text-rose-400 p-2 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={16} /></button>
             </div>
          </div>
        );
      })}
    </div>
  </motion.div>;
}

function RequestsView({ leaveRequests, overtimeRequests, onUpdateLeave, onUpdateOvertime, users }: any) {
  return <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} className="space-y-8 pb-20">
    <section className="space-y-4">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Pengajuan Izin Pending</h3>
      <div className="space-y-4">
        {leaveRequests.filter((l:any) => l.status === 'pending').map((req:any) => {
          const u = users.find((x:any) => x.id === req.userId);
          return <div key={req.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 border-l-4 border-l-amber-500 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <h4 className="text-[12px] font-black uppercase text-slate-800">{u?.name}</h4>
                <span className="bg-amber-50 text-amber-600 text-[8px] font-black px-2 py-0.5 rounded italic">{req.type}</span>
             </div>
             <p className="text-[10px] font-medium text-slate-500 italic mb-4">"{req.reason}"</p>
             <div className="flex gap-2">
                <button onClick={() => onUpdateLeave(req.id, 'approved')} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase italic">Setuju</button>
                <button onClick={() => onUpdateLeave(req.id, 'rejected')} className="flex-1 py-2 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase italic border border-slate-100">Tolak</button>
             </div>
          </div>;
        })}
      </div>
    </section>
  </motion.div>;
}

function ProfileView({ profile, onUpdate }: any) {
  const [data, setData] = useState<SchoolProfile>(profile);
  const [success, setSuccess] = useState(false);

  const handleImageChange = (field: keyof SchoolProfile, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setData({ ...data, [field]: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    await onUpdate(data);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 pb-24">
      {/* Visual Identity Section */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-400">Identitas Visual</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-400 italic">Logo Sekolah</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                {data.logo ? <img src={data.logo} className="w-full h-full object-contain" alt="Logo" /> : <School className="text-slate-300" />}
              </div>
              <label className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase italic cursor-pointer hover:bg-slate-700 transition-colors">
                Upload Logo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange('logo', e)} />
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-slate-400 italic">Foto Banner / Gedung</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                {data.bannerPhoto ? <img src={data.bannerPhoto} className="w-full h-full object-cover" alt="Banner" /> : <div className="w-full h-full flex items-center justify-center"><Camera className="text-slate-300" size={16} /></div>}
              </div>
              <label className="bg-slate-800 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase italic cursor-pointer hover:bg-slate-700 transition-colors">
                Upload Foto
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange('bannerPhoto', e)} />
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Basic Information */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-5">
        <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-400">Informasi Umum</h3>
        <Input label="Nama Lengkap Sekolah" value={data.name} onChange={(v: string) => setData({ ...data, name: v })} />
        <Input label="Moto Sekolah" value={data.motto || ''} onChange={(v: string) => setData({ ...data, motto: v })} placeholder="Contoh: Maju Bersama, Hebat Semua" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Akreditasi" value={data.accreditation || ''} onChange={(v: string) => setData({ ...data, accreditation: v })} />
          <Input label="Telepon" value={data.phone} onChange={(v: string) => setData({ ...data, phone: v })} />
        </div>
        <Input label="Email Official" value={data.email} onChange={(v: string) => setData({ ...data, email: v })} />
        <Input label="Website" value={data.website} onChange={(v: string) => setData({ ...data, website: v })} />
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-slate-400 italic">Alamat Lengkap</label>
          <textarea value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-black italic focus:outline-none" rows={2} />
        </div>
      </section>

      {/* Leadership */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-400">Kepemimpinan</h3>
        <div className="flex gap-6 items-start">
          <div className="space-y-2">
            <div className="w-24 h-32 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
              {data.headmasterPhoto ? <img src={data.headmasterPhoto} className="w-full h-full object-cover" alt="Headmaster" /> : <div className="w-full h-full flex items-center justify-center"><UserIcon className="text-slate-200" size={32} /></div>}
            </div>
            <label className="block w-full text-center bg-slate-100 text-slate-600 py-2 rounded-xl text-[8px] font-black uppercase italic cursor-pointer hover:bg-slate-200 transition-colors">
              FOTO
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange('headmasterPhoto', e)} />
            </label>
          </div>
          <div className="flex-1 space-y-4">
            <Input label="Nama Kepala Sekolah" value={data.headmaster} onChange={(v: string) => setData({ ...data, headmaster: v })} />
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 italic">Kata Sambutan / Sejarah Singkat</label>
              <textarea value={data.history || ''} onChange={(e) => setData({ ...data, history: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-black italic focus:outline-none" rows={4} />
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-400">Visi & Misi</h3>
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-slate-400 italic">Visi Sekolah</label>
          <textarea value={data.vision} onChange={(e) => setData({ ...data, vision: e.target.value })} className="w-full bg-indigo-50/30 border border-indigo-100 rounded-2xl p-4 text-xs font-black italic text-indigo-900 focus:outline-none" rows={3} />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 italic">Misi Sekolah (Satu per baris)</label>
          <textarea 
            value={data.mission.join('\n')} 
            onChange={(e) => setData({ ...data, mission: e.target.value.split('\n').filter(l => l.trim() !== '') })} 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold italic focus:outline-none" 
            rows={5} 
            placeholder="Masukkan misi sekolah..."
          />
        </div>
      </section>

      {/* Facilities */}
      <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-400">Fasilitas Sekolah</h3>
        <textarea 
          placeholder="Laboratorium, Perpustakaan, Lapangan Basket, dll (Pisahkan dengan koma)" 
          value={data.facilities?.join(', ') || ''} 
          onChange={(e) => setData({ ...data, facilities: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') })} 
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-black italic focus:outline-none" 
          rows={3} 
        />
      </section>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-6">
        <button 
          onClick={handleSave}
          className={`w-full py-4 rounded-[2rem] font-black uppercase tracking-widest text-xs italic shadow-2xl transition-all flex items-center justify-center gap-3 ${success ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}
        >
          {success ? <CheckCircle2 /> : <Save size={18} />}
          {success ? 'Tersimpan!' : 'Simpan & Sinkron'}
        </button>
      </div>
    </motion.div>
  );
}

function MediaView({ media, onDelete, onAdd }: any) {
  const [activeTab, setActiveTab] = useState('ALL');
  
  const categories = [
    { id: 'ALL', label: 'Semua' },
    { id: 'RUANG_GURU', label: 'Ruang Guru' },
    { id: 'GAME', label: 'Game' },
    { id: 'YOUTUBE', label: 'Youtube' }
  ];

  const filteredMedia = activeTab === 'ALL' 
    ? media 
    : media.filter((m: any) => m.category === activeTab);

  const getIcon = (cat: string) => {
    if (cat === 'YOUTUBE') return <Youtube size={16} className="text-rose-500" />;
    if (cat === 'GAME') return <Gamepad2 size={16} className="text-emerald-500" />;
    return <BookOpen size={16} className="text-indigo-500" />;
  };

  const getLabel = (cat: string) => {
    if (cat === 'YOUTUBE') return 'Youtube';
    if (cat === 'GAME') return 'Game Pembelajaran';
    return 'Ruang Guru Nasional';
  };

  return <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} className="space-y-6 pb-20">
    <div className="flex gap-2">
       <button onClick={onAdd} className="flex-1 py-4 bg-slate-800 text-white rounded-3xl font-black uppercase tracking-widest text-[9px] italic shadow-lg flex items-center justify-center gap-2">
          <Plus size={16} />
          Tambah Media Baru
       </button>
    </div>

    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map(cat => (
        <button 
          key={cat.id}
          onClick={() => setActiveTab(cat.id)}
          className={`shrink-0 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase italic transition-all ${activeTab === cat.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
        >
          {cat.label}
        </button>
      ))}
    </div>

    <div className="grid grid-cols-1 gap-4">
      {filteredMedia.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-[2.5rem] border border-slate-100">
           <p className="text-[10px] font-black uppercase italic text-slate-300">Belum ada media di kategori ini</p>
        </div>
      ) : (
        filteredMedia.map((item:any) => (
          <div key={item.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                {getIcon(item.category)}
             </div>
             <div className="flex-1 min-w-0">
                <span className="text-[8px] font-black text-indigo-500 uppercase italic leading-none">{getLabel(item.category)}</span>
                <h4 className="text-[11px] font-black uppercase text-slate-800 truncate mb-1">{item.title}</h4>
                <p className="text-[9px] font-medium text-slate-400 truncate italic">{item.url}</p>
             </div>
             <button onClick={() => onDelete(item.id)} className="text-rose-400 p-3 hover:bg-rose-50 rounded-2xl transition-colors">
                <Trash2 size={16} />
             </button>
          </div>
        ))
      )}
    </div>
  </motion.div>;
}

function ActivityView({ posts, users, onDeletePost, activities, onUpdateActivity }: any) {
  return <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} className="space-y-6 pb-20">
    <div className="space-y-6">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Feed Monitoring Guru</h3>
      {posts.map((p:any) => {
        const u = users.find((x:any) => x.id === p.userId);
        return <div key={p.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
           <div className="p-4 flex justify-between items-center border-b border-slate-50">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-[10px] font-black">{u?.name.charAt(0)}</div>
                 <h4 className="text-[10px] font-black uppercase text-slate-800">{u?.name}</h4>
              </div>
              <button onClick={() => onDeletePost(p.id)} className="text-rose-400"><Trash2 size={16} /></button>
           </div>
           <div className="p-5">
              {p.image && <img src={p.image} className="w-full aspect-video object-cover rounded-xl mb-3 shadow-sm" alt="Post" />}
              <p className="text-[10px] font-medium text-slate-600 italic">"{p.content}"</p>
           </div>
        </div>;
      })}
    </div>
  </motion.div>;
}

function AttendanceRecap({ users, attendance, activities, onDeleteActivity, schoolProfile }: any) {
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'activities'>('attendance');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'hadir': return 'bg-emerald-100 text-emerald-600';
      case 'terlambat':
      case 'late': return 'bg-rose-100 text-rose-600';
      case 'pulang_cepat': return 'bg-amber-100 text-amber-600';
      default: return 'bg-indigo-100 text-indigo-600';
    }
  };

  const exportExcel = () => {
    const title = [["REKAPITULASI ABSENSI GURU"]];
    const school = [[schoolProfile.name.toUpperCase()]];
    const printedAt = [[`Dicetak pada: ${format(new Date(), 'eeee, dd MMMM yyyy HH:mm', { locale: id })}`]];
    const emptyRow = [[]];

    const tableHeaders = [["NO", "NAMA GURU", "NIP", "TANGGAL", "JAM MASUK", "JAM PULANG", "STATUS", "KEAMANAN", "KOORDINAT LOKASI"]];
    
    const tableData = attendance.sort((a: any, b: any) => b.date.localeCompare(a.date)).map((rec: any, index: number) => {
      const u = users.find((x: any) => x.id === rec.userId);
      let securityStatus = "VALID";
      if (rec.violationType === 'fake_gps') securityStatus = "PELANGGARAN: FAKE GPS";
      else if (rec.violationType === 'outside_radius') securityStatus = "DI LUAR RADIUS";

      return [
        index + 1,
        u?.name || 'Unknown',
        u?.employeeId || '-',
        rec.date,
        rec.clockIn,
        rec.clockOut || '-',
        rec.status.toUpperCase(),
        securityStatus,
        rec.locationIn || '-'
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([
      ...title,
      ...school,
      ...printedAt,
      ...emptyRow,
      ...tableHeaders,
      ...tableData
    ]);

    // Apply some basic styling (column widths)
    worksheet['!cols'] = [
      { wch: 5 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 30 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Absensi");
    XLSX.writeFile(workbook, `Rekap_Absensi_${schoolProfile.name.replace(/\s+/g, '_')}_${format(new Date(), 'dd_MMM_yyyy')}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text("REKAPITULASI ABSENSI GURU", 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolProfile.name.toUpperCase(), 105, 22, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Dicetak pada: ${format(new Date(), 'eeee, dd MMMM yyyy HH:mm', { locale: id })}`, 105, 28, { align: 'center' });

    const tableColumn = ["NO", "NAMA GURU", "TANGGAL", "CLOCK IN", "CLOCK OUT", "STATUS", "KEAMANAN"];
    const tableRows = attendance.sort((a: any, b: any) => b.date.localeCompare(a.date)).map((rec: any, index: number) => {
      const u = users.find((x: any) => x.id === rec.userId);
      let securityStatus = "VALID";
      if (rec.violationType === 'fake_gps') securityStatus = "FAKE GPS";
      else if (rec.violationType === 'outside_radius') securityStatus = "LUAR RADIUS";

      return [
        index + 1,
        u?.name || 'Unknown',
        rec.date,
        rec.clockIn,
        rec.clockOut || '-',
        rec.status.toUpperCase(),
        securityStatus
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 8, font: 'helvetica', cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 50 },
        5: { fontStyle: 'bold' }
      }
    });

    doc.save(`Rekap_Absensi_${schoolProfile.name.replace(/\s+/g, '_')}.pdf`);
  };

  return <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} className="space-y-6 pb-20">
    <div className="flex gap-2 p-1 bg-slate-100 rounded-[2rem]">
      <button 
        onClick={() => setActiveTab('attendance')}
        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-[1.5rem] transition-all ${activeTab === 'attendance' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
      >
        Rekap Absensi
      </button>
      <button 
        onClick={() => setActiveTab('activities')}
        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-[1.5rem] transition-all ${activeTab === 'activities' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
      >
        Riwayat Aktivitas
      </button>
    </div>

    {activeTab === 'attendance' ? (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={exportExcel}
            className="flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-3xl font-black uppercase italic text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
          >
            <FileSpreadsheet size={16} />
            Excel
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center justify-center gap-2 py-4 bg-rose-600 text-white rounded-3xl font-black uppercase italic text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
          >
            <FileDown size={16} />
            PDF
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm divide-y divide-slate-50">
          {attendance.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
                <p className="text-[10px] font-black uppercase italic tracking-widest">Belum ada data absensi</p>
            </div>
          ) : (
            attendance.sort((a: any, b: any) => b.date.localeCompare(a.date)).map((rec:any) => {
              const u = users.find((x:any) => x.id === rec.userId);
              return <div key={rec.id} className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => rec.photoIn && setViewPhoto(rec.photoIn)}
                      className="w-12 h-12 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center text-slate-300 font-black relative group shadow-sm border border-slate-50"
                    >
                      {rec.photoIn ? (
                        <img src={rec.photoIn} className="w-full h-full object-cover" alt="Profile" />
                      ) : (
                        u?.name.charAt(0)
                      )}
                      {rec.photoIn && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={14} className="text-white" />
                      </div>}
                    </button>
                    <div>
                      <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-tight">{u?.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic ${getStatusColor(rec.status)}`}>
                            {rec.status.toUpperCase()}
                          </span>
                          {rec.violationType === 'fake_gps' && (
                             <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic bg-rose-500 text-white animate-pulse flex items-center gap-1">
                                <AlertCircle size={8} /> FAKE GPS DETECTED
                             </span>
                          )}
                          {rec.violationType === 'outside_radius' && (
                             <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic bg-amber-500 text-white">
                                OUTSIDE RADIUS
                             </span>
                          )}
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{rec.date}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                      <div className="text-center cursor-pointer group" onClick={() => rec.photoIn && setViewPhoto(rec.photoIn)}>
                        <p className="text-[7px] font-black text-slate-300 uppercase mb-0.5">In</p>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-black text-indigo-600 italic">{rec.clockIn}</span>
                          {rec.photoIn && <Camera size={10} className="text-indigo-400 group-hover:scale-125 transition-transform" />}
                        </div>
                      </div>
                      <div className="text-center cursor-pointer group" onClick={() => rec.photoOut && setViewPhoto(rec.photoOut)}>
                        <p className="text-[7px] font-black text-slate-300 uppercase mb-0.5">Out</p>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-black text-emerald-600 italic">{rec.clockOut || '--:--'}</span>
                          {rec.photoOut && <Camera size={10} className="text-emerald-400 group-hover:scale-125 transition-transform" />}
                        </div>
                      </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <MapPin size={12} className="text-indigo-500" />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[9px] font-bold text-slate-500 italic truncate max-w-[150px]">Lat/Lng: {rec.locationIn || 'N/A'}</p>
                        <p className="text-[8px] text-slate-400 font-medium tracking-tight">Terdeteksi di Lokasi Absensi</p>
                      </div>
                  </div>
                  <button 
                      onClick={() => {
                        const coords = rec.locationIn || `${-5.3971},${105.2667}`;
                        window.open(`https://www.google.com/maps/search/?api=1&query=${coords}`, '_blank');
                      }}
                      className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase italic shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                      <Map size={10} />
                      Cek Lokasi
                  </button>
                </div>
              </div>;
            })
          )}
        </div>
      </div>
    ) : (
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase italic text-slate-400 tracking-widest pl-2">Riwayat Jurnal & Foto Aktivitas</h3>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-[2.5rem] border border-slate-100 text-slate-400">
               <p className="text-[10px] font-black uppercase italic tracking-widest">Belum ada riwayat aktivitas</p>
            </div>
          ) : (
            activities.sort((a: any, b: any) => b.id.localeCompare(a.id)).map((act: any) => {
              const u = users.find((x: any) => x.id === act.userId);
              return (
                <div key={act.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  {act.photo && <img src={act.photo} className="w-full aspect-video object-cover" alt="Aktivitas" />}
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-[10px]">
                          {u?.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase text-slate-800">{u?.name}</h4>
                          <p className="text-[8px] font-bold text-slate-400 uppercase">{act.date} • {act.time}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setConfirmDeleteId(act.id)}
                        className="text-rose-400 p-2 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div>
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-slate-100 text-slate-600 italic mb-2 inline-block">
                          {act.type.replace('_', ' ')}
                        </span>
                        <p className="text-[10px] font-medium text-slate-600 italic">"{act.description}"</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    )}

    {confirmDeleteId && (
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center space-y-4 shadow-xl border border-slate-100">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-100 text-rose-500 flex items-center justify-center mx-auto animate-bounce">
            <Trash2 size={24} />
          </div>
          <div>
            <h4 className="text-slate-850 font-black uppercase text-sm tracking-widest italic">Hapus Aktivitas?</h4>
            <p className="text-[10px] text-slate-500 font-bold mt-1 max-w-xs mx-auto">Apakah Anda yakin ingin menghapus riwayat aktivitas ini secara permanen? Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Batal
            </button>
            <button
              onClick={() => {
                onDeleteActivity(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-rose-200 animate-pulse"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    )}

    <AnimatePresence>
      {viewPhoto && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl" onClick={() => setViewPhoto(null)}>
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0.9, opacity: 0 }}
             className="relative max-w-lg w-full bg-white rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
             onClick={e => e.stopPropagation()}
           >
              <div className="aspect-square w-full relative">
                <img src={viewPhoto} className="w-full h-full object-cover" alt="Bukti Absensi" />
                <div className="absolute inset-0 pointer-events-none border-4 border-white/10 rounded-[3rem]"></div>
              </div>
              
              <button 
                onClick={() => setViewPhoto(null)}
                className="absolute top-6 right-6 w-12 h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all active:scale-90"
              >
                <XCircle size={24} />
              </button>

              <div className="p-8 bg-white">
                 <div className="flex justify-between items-end">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase italic text-indigo-500 tracking-[0.2em]">Sertifikat Kehadiran</p>
                      <h3 className="text-sm font-black uppercase text-slate-800">Verifikasi Foto Biometrik</h3>
                   </div>
                   <button 
                     onClick={() => setViewPhoto(null)} 
                     className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase italic tracking-widest hover:bg-indigo-600 transition-colors"
                   >
                     Oke, Paham
                   </button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    </AnimatePresence>
  </motion.div>;
}

function AccessDenied({ onBack }: any) {
  return <div className="flex flex-col items-center justify-center min-h-screen p-10 text-center bg-slate-50">
    <ShieldCheck size={64} className="text-rose-500 mb-4" />
    <h1 className="text-2xl font-black text-slate-800 italic uppercase">Akses Terbatas</h1>
    <p className="text-slate-500 font-medium mt-2">Anda tidak memiliki izin administrator.</p>
    <button onClick={onBack} className="mt-8 px-10 py-4 bg-primary text-white font-black rounded-3xl italic shadow-2xl shadow-primary/20">KEMBALI KE BERANDA</button>
  </div>;
}
