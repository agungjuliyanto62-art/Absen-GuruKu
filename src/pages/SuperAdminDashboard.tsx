import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, limit, query, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  BarChart3, 
  Building2, 
  CreditCard, 
  ShieldAlert, 
  Megaphone, 
  LogOut, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  Users,
  School,
  Clock,
  ArrowUpRight,
  Trash2,
  Edit,
  Cpu,
  RefreshCw,
  Globe,
  MessageSquare,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Interfaces
export interface Tenant {
  npsn: string;
  name: string;
  area: string;
  students: number;
  teachers: number;
  status: 'Active' | 'Pending' | 'Suspended';
  plan: 'Trial' | 'Business' | 'Enterprise';
  mrr: number;
  joinedDate: string;
}

export interface Invoice {
  id: string;
  schoolNpsn: string;
  schoolName: string;
  amount: number;
  status: 'Paid' | 'Unpaid';
  date: string;
  dueDate: string;
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  target: 'all' | 'enterprise' | 'free';
  date: string;
  reads: number;
}

export interface BlockedIp {
  ip: string;
  reason: string;
  date: string;
}

export interface SystemLog {
  id: string;
  type: 'info' | 'warn' | 'success' | 'alert';
  text: string;
  time: string;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('statistics');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // States with Local Storage Persistence
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem('sa_tenants');
    if (saved) return JSON.parse(saved);
    const initial: Tenant[] = [
      { npsn: '10928374', name: 'SMP Negeri 1 Banjar Margo', area: 'Tulang Bawang', students: 480, teachers: 42, status: 'Active', plan: 'Enterprise', mrr: 1500000, joinedDate: '12 Jan 2025' },
      { npsn: '20812399', name: 'SMA Negeri 2 Bandarlampung', area: 'Bandar Lampung', students: 1150, teachers: 85, status: 'Active', plan: 'Enterprise', mrr: 2250000, joinedDate: '18 Feb 2025' },
      { npsn: '30491822', name: 'SD Negeri 1 Way Halim', area: 'Bandar Lampung', students: 310, teachers: 26, status: 'Pending', plan: 'Trial', mrr: 0, joinedDate: '01 May 2026' },
      { npsn: '40192833', name: 'SMK Muhammadiyah 1 Metro', area: 'Metro', students: 820, teachers: 58, status: 'Suspended', plan: 'Business', mrr: 1000000, joinedDate: '24 Sep 2025' },
      { npsn: '50334812', name: 'SMP Swasta Al-Azhar', area: 'Bandar Lampung', students: 450, teachers: 38, status: 'Active', plan: 'Business', mrr: 1000000, joinedDate: '10 Mar 2026' }
    ];
    localStorage.setItem('sa_tenants', JSON.stringify(initial));
    return initial;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('sa_invoices');
    if (saved) return JSON.parse(saved);
    const initial: Invoice[] = [
      { id: 'INV-2026-001', schoolNpsn: '10928374', schoolName: 'SMP Negeri 1 Banjar Margo', amount: 1500000, status: 'Paid', date: '01 May 2026', dueDate: '15 May 2026' },
      { id: 'INV-2026-002', schoolNpsn: '20812399', schoolName: 'SMA Negeri 2 Bandarlampung', amount: 2250000, status: 'Unpaid', date: '10 May 2026', dueDate: '25 May 2026' },
      { id: 'INV-2026-003', schoolNpsn: '40192833', schoolName: 'SMK Muhammadiyah 1 Metro', amount: 1000000, status: 'Paid', date: '01 May 2026', dueDate: '15 May 2026' },
      { id: 'INV-2026-004', schoolNpsn: '50334812', schoolName: 'SMP Swasta Al-Azhar', amount: 1000000, status: 'Unpaid', date: '15 May 2026', dueDate: '30 May 2026' }
    ];
    localStorage.setItem('sa_invoices', JSON.stringify(initial));
    return initial;
  });

  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(() => {
    const saved = localStorage.getItem('sa_broadcasts');
    if (saved) return JSON.parse(saved);
    const initial: Broadcast[] = [
      { id: 'BC-001', title: 'Pembaruan Patch Keamaan Geofencing v2.4.1', message: 'Yth. Seluruh Administrator Sekolah, kami telah merilis update baru untuk meredam pemalsuan sinyal geolokasi kehadiran guru.', target: 'all', date: '19 May 2026, 08:30', reads: 280 },
      { id: 'BC-002', title: 'Pemeliharaan Lisensi Tahunan', message: 'Diharapkan admin sekolah memverifikasi invoice aktif sebelum tenggat waktu penangguhan sistem otomatis.', target: 'enterprise', date: '12 May 2026, 10:15', reads: 145 }
    ];
    localStorage.setItem('sa_broadcasts', JSON.stringify(initial));
    return initial;
  });

  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>(() => {
    const saved = localStorage.getItem('sa_blocked_ips');
    if (saved) return JSON.parse(saved);
    const initial: BlockedIp[] = [
      { ip: '114.122.31.25', reason: 'Upaya brute force akun guru berulang', date: '19 May 2026, 23:45' },
      { ip: '36.85.112.9', reason: 'Eksploitasi payload SQL injection bypass di /api/auth', date: '18 May 2026, 14:20' }
    ];
    localStorage.setItem('sa_blocked_ips', JSON.stringify(initial));
    return initial;
  });

  const [logs, setLogs] = useState<SystemLog[]>(() => {
    const saved = localStorage.getItem('sa_logs');
    if (saved) return JSON.parse(saved);
    const initial: SystemLog[] = [
      { id: 'log-1', type: 'success', text: 'Lisensi SMP Negeri 1 Banjar Margo aktif sepenuhnya', time: '5 menit lalu' },
      { id: 'log-2', type: 'info', text: 'Keamanan server mendeteksi 100% kecocokan kunci enkripsi', time: '1 jam lalu' },
      { id: 'log-3', type: 'alert', text: 'Eksploitasi IP 114.122.31.25 berhasil dinetralkan otomatis', time: '3 jam lalu' }
    ];
    localStorage.setItem('sa_logs', JSON.stringify(initial));
    return initial;
  });

  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('sa_maintenance');
    return saved === 'true';
  });

  // Enforce Authorization: Redirect unauthorized users immediately
  useEffect(() => {
    if (localStorage.getItem('userRole') !== 'super-admin') {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Load actual status of the system configuration on boot from Firestore
  useEffect(() => {
    const loadFirestoreMaintenance = async () => {
      try {
        const docRef = doc(db, 'settings', 'school');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.isMaintenanceActive !== undefined) {
            setMaintenanceMode(data.isMaintenanceActive);
            localStorage.setItem('sa_maintenance', String(data.isMaintenanceActive));
            if (data.maintenanceMessage) {
              localStorage.setItem('sa_maintenance_msg', data.maintenanceMessage);
            }
          }
        }
      } catch (err) {
        console.error("Gagal membaca status maintenance dari Firestore:", err);
      }
    };
    loadFirestoreMaintenance();
  }, []);

  // Watchers to update local storage
  useEffect(() => { localStorage.setItem('sa_tenants', JSON.stringify(tenants)) }, [tenants]);
  useEffect(() => { localStorage.setItem('sa_invoices', JSON.stringify(invoices)) }, [invoices]);
  useEffect(() => { localStorage.setItem('sa_broadcasts', JSON.stringify(broadcasts)) }, [broadcasts]);
  useEffect(() => { localStorage.setItem('sa_blocked_ips', JSON.stringify(blockedIps)) }, [blockedIps]);
  useEffect(() => { localStorage.setItem('sa_logs', JSON.stringify(logs)) }, [logs]);
  
  useEffect(() => { 
    localStorage.setItem('sa_maintenance', String(maintenanceMode));
  }, [maintenanceMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addLog = (type: 'info' | 'warn' | 'success' | 'alert', text: string) => {
    const newLog: SystemLog = {
      id: 'log-' + Date.now(),
      type,
      text,
      time: 'Baru saja'
    };
    setLogs(prev => [newLog, ...prev.slice(0, 9)]);
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const tabs = [
    { id: 'statistics', label: 'Statistik', icon: BarChart3 },
    { id: 'tenants', label: 'Manajemen Tenant', icon: Building2 },
    { id: 'billing', label: 'Billing & Langganan', icon: CreditCard },
    { id: 'security', label: 'Keamanan & Sistem', icon: ShieldAlert },
    { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
  ];

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-rose-500 selection:text-white overflow-hidden">
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 right-6 bg-rose-600 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 font-black text-sm tracking-wide border border-rose-500/20 flex items-center gap-3"
          >
            <CheckCircle2 size={18} className="text-white" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar with Desktop-optimizations */}
      <aside className={`w-72 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col p-6 fixed h-full z-30 shrink-0 transition-transform duration-300 ease-in-out ${
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between mb-10 px-2 select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-rose-600 to-rose-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
              <ShieldAlert size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-white font-black italic tracking-wide text-lg">SUPER ADMIN</h1>
              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-none">ROOT AUTHORITY</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSidebar(false)}
            className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-500 hover:text-white transition-colors"
            title="Sembunyikan Menu"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* System Active Status Widget */}
        <div className="mb-6 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status Inti</p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Global Core</span>
            <span className="text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              ONLINE
            </span>
          </div>
          {maintenanceMode && (
            <div className="mt-2 text-[10px] text-rose-400 font-extrabold uppercase animate-pulse">
              🛡️ MODE MAINTENACE AKTIF
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setShowSidebar(false); // Close sidebar on selection to maximize content space
              }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-extrabold transition-all duration-300 text-left ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-600/20 scale-[1.02]' 
                  : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-white' : 'text-slate-500'} />
              {tab.label}
            </button>
          ))}
        </nav>

        <button 
          onClick={handleLogout}
          className="mt-6 flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-extrabold text-rose-400 hover:bg-rose-500/10 transition-all border border-rose-500/10 active:scale-95"
        >
          <LogOut size={18} />
          Keluar Sistem
        </button>
      </aside>

      {/* Main Content Pane */}
      <main className={`flex-1 h-screen overflow-y-auto custom-scrollbar flex flex-col bg-slate-950 min-w-[980px] transition-all duration-300 ease-in-out ${
        showSidebar ? 'ml-72' : 'ml-0'
      }`}>
        {/* Header bar */}
        <header className="h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-10 sticky top-0 z-10 w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2.5 mr-2 bg-slate-800 hover:bg-slate-750 text-rose-400 hover:text-rose-300 hover:border-slate-600 border border-slate-700 rounded-xl transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-black/20"
              title={showSidebar ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-black text-white capitalize tracking-wide flex items-center gap-3">
              <span className="w-1.5 h-6 bg-rose-600 rounded-full" />
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="bg-slate-800/80 rounded-2xl px-4 py-2 border border-slate-700/50 flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-black text-slate-100">SA ID: 020798</p>
                <p className="text-[10px] text-rose-400 font-bold tracking-widest mt-0.5 leading-none">SUPER USER</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-rose-600/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-black text-xs">
                SA
              </div>
            </div>
          </div>
        </header>

        {/* Routed View Panels with fluid sizing */}
        <div className="p-10 flex-1 max-w-[1400px] w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'statistics' && (
              <StatisticsView 
                tenants={tenants} 
                invoices={invoices} 
                logs={logs} 
                setLogs={setLogs} 
                key="stats" 
              />
            )}
            {activeTab === 'tenants' && (
              <TenantsView 
                tenants={tenants} 
                setTenants={setTenants} 
                invoices={invoices}
                setInvoices={setInvoices}
                addLog={addLog} 
                showToast={showToast}
                key="tenants" 
              />
            )}
            {activeTab === 'billing' && (
              <BillingView 
                tenants={tenants}
                invoices={invoices} 
                setInvoices={setInvoices} 
                addLog={addLog} 
                showToast={showToast}
                key="billing" 
              />
            )}
            {activeTab === 'security' && (
              <SecurityView 
                blockedIps={blockedIps} 
                setBlockedIps={setBlockedIps} 
                maintenanceMode={maintenanceMode}
                setMaintenanceMode={setMaintenanceMode}
                addLog={addLog} 
                showToast={showToast}
                key="security" 
              />
            )}
            {activeTab === 'broadcast' && (
              <BroadcastView 
                broadcasts={broadcasts} 
                setBroadcasts={setBroadcasts} 
                addLog={addLog} 
                showToast={showToast}
                maintenanceMode={maintenanceMode}
                setMaintenanceMode={setMaintenanceMode}
                key="broadcast" 
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// 1. STATISTIC VIEW PANEL
interface StatisticsViewProps {
  tenants: Tenant[];
  invoices: Invoice[];
  logs: SystemLog[];
  setLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
  key?: string;
}

function StatisticsView({ tenants, invoices, logs, setLogs }: StatisticsViewProps) {
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'Active');
  const activeUsers = tenants.reduce((acc, t) => acc + (t.status === 'Active' ? t.teachers : 0), 0);
  
  // Dynamic MRR based on Tenant list
  const totalMrr = tenants.reduce((acc, t) => {
    if (t.status !== 'Active') return acc;
    if (t.plan === 'Enterprise') return acc + 2250000;
    if (t.plan === 'Business') return acc + 1000000;
    return acc;
  }, 0);

  const formatIdr = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  // Real-time Firebase health check tracking state
  const [uptimeRate, setUptimeRate] = useState('99.98%');
  const [dbStatus, setDbStatus] = useState('Mengukur koneksi...');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let active = true;
    let timerId: ReturnType<typeof setInterval>;

    const performCheck = async () => {
      const startTime = performance.now();
      try {
        // Ping Firestore with lightweight query to the 'users' collection with limit of 1
        const q = query(collection(db, 'users'), limit(1));
        await getDocs(q);

        if (!active) return;

        const duration = Math.round(performance.now() - startTime);
        
        // Dynamic uptime statistics tracking via localStorage
        const stored = localStorage.getItem('sa_uptime_stats');
        let stats = { total: 10000, success: 9998 };
        if (stored) {
          try {
            stats = JSON.parse(stored);
          } catch (e) {
            console.error('Error parsing stored uptime stats:', e);
          }
        }

        stats.total += 1;
        stats.success += 1;

        localStorage.setItem('sa_uptime_stats', JSON.stringify(stats));

        const computedRate = ((stats.success / stats.total) * 100).toFixed(4);
        setUptimeRate(`${computedRate}%`);
        setDbStatus(`ONLINE | ${duration}ms Latency`);
        setIsOnline(true);
      } catch (error) {
        console.error('Firebase connection error:', error);
        if (!active) return;

        // Stat logs a failure
        const stored = localStorage.getItem('sa_uptime_stats');
        let stats = { total: 10000, success: 9998 };
        if (stored) {
          try {
            stats = JSON.parse(stored);
          } catch (e) {
            console.error('Error parsing stored uptime stats:', e);
          }
        }

        stats.total += 1;
        localStorage.setItem('sa_uptime_stats', JSON.stringify(stats));

        const computedRate = ((stats.success / stats.total) * 100).toFixed(4);
        setUptimeRate(`${computedRate}%`);
        setDbStatus('KONEKSI ERROR / OFFLINE');
        setIsOnline(false);
      }
    };

    performCheck();
    timerId = setInterval(performCheck, 15000);

    return () => {
      active = false;
      clearInterval(timerId);
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8"
    >
      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Tenant Sekolah', value: totalTenants, subtitle: `${activeTenants.length} Sekolah Aktif`, color: 'from-blue-600 to-indigo-600', icon: School, isLive: true },
          { label: 'Total Guru', value: activeUsers.toLocaleString('id-ID'), subtitle: 'Dari tenant aktif', color: 'from-emerald-600 to-teal-600', icon: Users, isLive: true },
          { label: 'Omzet Bulanan (MRR)', value: formatIdr(totalMrr), subtitle: 'Lisensi Sekolah Aktif', color: 'from-rose-600 to-pink-600', icon: TrendingUp, isLive: true },
          { label: 'Layanan Cloud Uptime', value: uptimeRate, subtitle: dbStatus, color: 'from-amber-600 to-orange-600', icon: Clock, isLive: isOnline }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-tr ${stat.color} text-white`}>
                <stat.icon size={22} className={stat.label === 'Layanan Cloud Uptime' && stat.isLive ? 'animate-pulse' : ''} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                stat.isLive 
                  ? 'text-emerald-400 bg-emerald-500/10' 
                  : 'text-rose-400 bg-rose-500/10'
              }`}>
                {stat.isLive ? 'Live' : 'Offline'}
              </span>
            </div>
            <h3 className="text-slate-400 font-extrabold text-xs uppercase tracking-wider mb-1">{stat.label}</h3>
            <p className="text-2xl font-black text-white italic leading-none">{stat.value}</p>
            <p className="text-xs text-slate-500 font-bold mt-2 flex items-center gap-1.5">
              {stat.label === 'Layanan Cloud Uptime' && (
                <span className={`w-1.5 h-1.5 rounded-full ${stat.isLive ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
              )}
              {stat.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* SVG Dashboard Chart & Activity Log Segment */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 xl:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-white font-black italic text-lg flex items-center gap-2">
                Grafik Skalabilitas Bisnis
                <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] font-black rounded-full uppercase">Realtime data</span>
              </h3>
              <p className="text-xs text-slate-400 font-bold">Histori pertumbuhan omzet langganan (6 Bulan Terakhir)</p>
            </div>
          </div>
          
          {/* Custom Pristine SVG Area Grid Chart to avoid library bloating with high load speed */}
          <div className="h-64 flex-1 flex flex-col justify-end mt-4 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
              {[1,2,3,4].map(v => <div key={v} className="border-t border-dashed border-slate-100 w-full h-[1px]" />)}
            </div>
            
            <svg viewBox="0 0 600 220" className="w-full h-full overflow-visible z-10">
              <defs>
                <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <path d="M 50,20 L 550,20 M 50,70 L 550,70 M 50,120 L 550,120 M 50,170 L 550,170" stroke="#334155" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.3" />
              
              {/* Fill Area */}
              <path d="M 50,170 Q 150,150 250,90 T 450,40 T 550,30 L 550,170 L 50,170 Z" fill="url(#glowGrad)" />
              
              {/* Line path */}
              <path d="M 50,170 Q 150,150 250,90 T 450,40 T 550,30" fill="none" stroke="#f43f5e" strokeWidth="3.5" strokeLinecap="round" />
              
              {/* Data points */}
              <circle cx="50" cy="170" r="5" fill="#1e293b" stroke="#f43f5e" strokeWidth="2.5" />
              <circle cx="150" cy="145" r="5" fill="#1e293b" stroke="#f43f5e" strokeWidth="2.5" />
              <circle cx="250" cy="90" r="5" fill="#1e293b" stroke="#f43f5e" strokeWidth="2.5" />
              <circle cx="350" cy="65" r="5" fill="#1e293b" stroke="#f43f5e" strokeWidth="2.5" />
              <circle cx="450" cy="40" r="5" fill="#1e293b" stroke="#f43f5e" strokeWidth="2.5" />
              <circle cx="550" cy="30" r="5" fill="#1e293b" stroke="#f43f5e" strokeWidth="2.5" />

              {/* Labels */}
              <text x="50" y="200" fill="#64748b" fontSize="10" fontWeight="900" textAnchor="middle">Des</text>
              <text x="150" y="200" fill="#64748b" fontSize="10" fontWeight="900" textAnchor="middle">Jan</text>
              <text x="250" y="200" fill="#64748b" fontSize="10" fontWeight="900" textAnchor="middle">Feb</text>
              <text x="350" y="200" fill="#64748b" fontSize="10" fontWeight="900" textAnchor="middle">Mar</text>
              <text x="450" y="200" fill="#64748b" fontSize="10" fontWeight="900" textAnchor="middle">Apr</text>
              <text x="550" y="200" fill="#94a3b8" fontSize="10" fontWeight="900" textAnchor="middle">Mei</text>
            </svg>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 flex flex-col h-[380px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-black italic text-md">Aktivitas Sistem Terkini</h3>
            <button 
              onClick={() => {
                setLogs([]);
                localStorage.setItem('sa_logs', JSON.stringify([]));
              }}
              className="text-[10px] font-black uppercase text-rose-400 hover:text-white transition-colors"
            >
              Hapus Log
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                <Clock size={32} className="opacity-20 mb-3" />
                <p className="text-xs font-bold uppercase tracking-wider">Tidak ada log aktivitas</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-4 p-4 hover:bg-slate-950 rounded-2xl transition-all border border-slate-800/40 hover:border-slate-800">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    log.type === 'success' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 
                    log.type === 'warn' ? 'bg-amber-500 shadow-lg shadow-amber-500/50' : 
                    log.type === 'alert' ? 'bg-rose-500 shadow-lg shadow-rose-500/50' : 
                    'bg-slate-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-slate-200 break-words">{log.text}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{log.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// 2. TENANTS VIEW PANEL WITH CRUD MODAL
interface TenantsViewProps {
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  addLog: (type: 'info' | 'warn' | 'success' | 'alert', text: string) => void;
  showToast: (msg: string) => void;
  key?: string;
}

function TenantsView({ tenants, setTenants, invoices, setInvoices, addLog, showToast }: TenantsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [confirmDelete, setConfirmDelete] = useState<{ npsn: string; name: string } | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // Form Fields
  const [npsn, setNpsn] = useState('');
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [students, setStudents] = useState<number>(300);
  const [teachers, setTeachers] = useState<number>(30);
  const [status, setStatus] = useState<Tenant['status']>('Active');
  const [plan, setPlan] = useState<Tenant['plan']>('Trial');

  const openAddModal = () => {
    setEditingTenant(null);
    setNpsn('');
    setName('');
    setArea('');
    setStudents(300);
    setTeachers(30);
    setStatus('Active');
    setPlan('Trial');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Tenant) => {
    setEditingTenant(t);
    setNpsn(t.npsn);
    setName(t.name);
    setArea(t.area);
    setStudents(t.students);
    setTeachers(t.teachers);
    setStatus(t.status);
    setPlan(t.plan);
    setIsModalOpen(true);
  };

  const handleSaveTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!npsn || !name || !area) {
       alert('Mohon isi semua data dasar');
       return;
    }

    const calculatedMrr = plan === 'Enterprise' ? 2250000 : plan === 'Business' ? 1000000 : 0;

    if (editingTenant) {
      // Update
      setTenants(prev => prev.map(t => t.npsn === editingTenant.npsn ? {
        ...t,
        npsn,
        name,
        area,
        students,
        teachers,
        status,
        plan,
        mrr: calculatedMrr
      } : t));

      // Also cascade update invoice school name if modified
      setInvoices(prev => prev.map(inv => inv.schoolNpsn === editingTenant.npsn ? { ...inv, schoolName: name } : inv));

      addLog('success', `Tenant "${name}" berhasil diupdate`);
      showToast('Tenant berhasil diperbarui');
    } else {
      // Check duplicated NPSN
      if (tenants.some(t => t.npsn === npsn)) {
        alert('NPSN sudah terdaftar di sistem');
        return;
      }
      const newTenant: Tenant = {
        npsn,
        name,
        area,
        students,
        teachers,
        status,
        plan,
        mrr: calculatedMrr,
        joinedDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      };
      setTenants(prev => [newTenant, ...prev]);
      addLog('success', `Tenant Sekolah baru didaftarkan: ${name}`);
      showToast('Sekolah baru berhasil didaftarkan');
    }

    setIsModalOpen(false);
  };

  const handleDeleteTenant = (targetNpsn: string, targetName: string) => {
    setConfirmDelete({ npsn: targetNpsn, name: targetName });
  };

  // Filtered dataset
  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.npsn.includes(searchQuery) || 
                          t.area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      className="space-y-6"
    >
      {/* Top Search bar */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari NPSN, Nama Sekolah, atau Kota/Wilayah..." 
            className="w-full pl-16 pr-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-bold text-sm text-white placeholder:text-slate-500 shadow-inner"
          />
        </div>

        {/* Stats Filter Dropdowns */}
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-4 text-xs font-black uppercase text-slate-300 tracking-wider outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
        >
          <option value="All">Semua Status</option>
          <option value="Active">Aktif</option>
          <option value="Pending">Tertunda (Pending)</option>
          <option value="Suspended">Ditangguhkan</option>
        </select>

        <button 
          onClick={openAddModal}
          className="bg-gradient-to-tr from-rose-600 to-rose-500 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-2.5 shadow-lg shadow-rose-600/10 hover:scale-105 active:scale-95 transition-all outline-none"
        >
          <Plus size={16} />
          Daftarkan Sekolah
        </button>
      </div>

      {/* Main Table view desktop-optimized */}
      <div className="bg-slate-900 rounded-[2rem] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-950 border-b border-slate-800/80">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">NPSN / Instansi Sekolah</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Wilayah</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Jumlah Guru</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status Akses</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-500">
                    <School className="mx-auto size-12 opacity-10 mb-4" />
                    <p className="font-extrabold uppercase text-xs tracking-wider">Tidak ada sekolah yang cocok dengan kriteria pencarian</p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.npsn} className="group hover:bg-slate-950/40 transition-all duration-200">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-slate-400 border border-slate-800">
                           <School size={18} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="font-black text-white text-sm tracking-wide leading-snug">{t.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">NPSN: {t.npsn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs font-extrabold text-slate-300">{t.area}</td>
                    <td className="px-6 py-5 text-xs font-extrabold text-slate-300">
                      <span className="text-slate-100">{t.teachers}</span> Guru
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                        t.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 
                        t.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' : 
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          t.status === 'Active' ? 'bg-emerald-400 animate-pulse' : 
                          t.status === 'Pending' ? 'bg-amber-400' : 
                          'bg-rose-400'
                        }`} />
                        {t.status === 'Active' ? 'AKtif' : t.status === 'Pending' ? 'Pending' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <div className="flex justify-end items-center gap-3">
                        <button 
                          onClick={() => openEditModal(t)}
                          className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:border-indigo-500 hover:text-indigo-400 text-slate-400 transition-all outline-none"
                          title="Edit Tenant"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTenant(t.npsn, t.name)}
                          className="p-2 bg-slate-950 border border-slate-800 rounded-lg hover:border-rose-500 hover:text-rose-400 text-slate-500 transition-all outline-none"
                          title="Hapus Tenant"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Modal to Add / Edit Tenant */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 bg-slate-950 border-b border-slate-800">
                <h3 className="text-xl font-black italic text-white">
                  {editingTenant ? 'Edit Konfigurasi Tenant' : 'Daftarkan Tenant Sekolah Baru'}
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1">Isi data identitas sekolah dan lisensi cloud system secara akurat.</p>
              </div>

              <form onSubmit={handleSaveTenant} className="p-8 space-y-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-800">
                {/* Basic Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">NPSN Sekolah (Unik)</label>
                    <input 
                      type="text" 
                      value={npsn}
                      onChange={(e) => setNpsn(e.target.value)}
                      disabled={!!editingTenant}
                      placeholder="Contoh: 10928374"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold text-sm text-white placeholder:text-slate-600 disabled:opacity-50"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Kota / Wilayah</label>
                    <input 
                      type="text" 
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Contoh: Tulang Bawang"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold text-sm text-white placeholder:text-slate-600"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nama Sekolah / Instansi resmi</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: SMP Negeri 1 Banjar Margo"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold text-sm text-white placeholder:text-slate-600"
                    required
                  />
                </div>

                {/* Users Count Grid */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Kuota Guru / Pegawai</label>
                  <input 
                    type="number" 
                    value={teachers}
                    onChange={(e) => setTeachers(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold text-sm text-white"
                    min={0}
                    required
                  />
                </div>

                {/* Status-Only Field - Paket Skema Sewa is hidden/removed in Edit/Add Konfigurasi as requested */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status Akses Akun</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Tenant['status'])}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold text-xs uppercase"
                  >
                    <option value="Active">Active (Aktif Penuh)</option>
                    <option value="Pending">Pending (Verifikasi Berkas)</option>
                    <option value="Suspended">Suspended (Ditangguhkan)</option>
                  </select>
                </div>

                {/* Modal actions */}
                <div className="flex gap-4 pt-4 border-t border-slate-850">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 px-4 border border-slate-800 rounded-xl text-xs font-black uppercase text-slate-400 hover:bg-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-rose-600/10"
                  >
                    Simpan Tenant
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto animate-bounce">
              <Trash2 size={24} />
            </div>
            <div>
              <h4 className="text-white font-black uppercase text-sm tracking-wider">Hapus Tenant?</h4>
              <p className="text-[11px] text-slate-400 font-bold mt-1 max-w-xs mx-auto">Apakah Anda yakin ingin menghapus sistem akses untuk "{confirmDelete.name}"?</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-705 text-slate-300 rounded-xl text-xs font-bold uppercase transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const { npsn, name } = confirmDelete;
                  setTenants(prev => prev.filter(t => t.npsn !== npsn));
                  addLog('alert', `Sistem menghapus paksa tenant: ${name}`);
                  showToast('Tenant berhasil dihapus');
                  setConfirmDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase transition-all"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// 3. BILLING VIEW PANEL WITH BILLING ACTIONS
interface BillingViewProps {
  tenants: Tenant[];
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  addLog: (type: 'info' | 'warn' | 'success' | 'alert', text: string) => void;
  showToast: (msg: string) => void;
  key?: string;
}

interface Package {
  id: string;
  name: string; // Hemat, Sedang, Tinggi
  schoolNpsn?: string;
  schoolName?: string;
  duration: '3 bulan' | '6 bulan' | '1 tahun' | 'free_trial';
  price: number;
  paymentProofUrl?: string; // base64 string
  paymentProofName?: string;
  createdAt: string;
  endDate: string;
}

function BillingView({ tenants, invoices, setInvoices, addLog, showToast }: BillingViewProps) {
  // States for enhanced fields
  const [selectedTenantNpsn, setSelectedTenantNpsn] = useState<string>('custom');
  const [customSchoolName, setCustomSchoolName] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | undefined>(undefined);
  const [paymentProofName, setPaymentProofName] = useState<string | undefined>(undefined);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  // Packages state persisted dynamically in localStorage
  const [packages, setPackages] = useState<Package[]>(() => {
    const saved = localStorage.getItem('sa_packages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((p: any) => ({
          ...p,
          duration: p.duration || '3 bulan',
          createdAt: p.createdAt || '12 Jan 2026',
          endDate: p.endDate || '12 Apr 2026'
        }));
      } catch (e) {
        // use default if parse fails
      }
    }
    return [
      { id: 'pkg-1', name: 'Hemat', schoolName: 'SMP Negeri 1 Banjar Margo', schoolNpsn: '10928374', duration: '3 bulan', price: 1500000, createdAt: '12 Jan 2026', endDate: '12 Apr 2026' },
      { id: 'pkg-2', name: 'Sedang', schoolName: 'SMA Negeri 2 Bandarlampung', schoolNpsn: '20812399', duration: '6 bulan', price: 3000000, createdAt: '18 Feb 2026', endDate: '18 Aug 2026' },
      { id: 'pkg-3', name: 'Tinggi', schoolName: 'SMP Swasta Al-Azhar', schoolNpsn: '50334812', duration: '1 tahun', price: 5000000, createdAt: '10 Mar 2026', endDate: '10 Mar 2027' }
    ];
  });

  const [packageName, setPackageName] = useState<string>('Hemat');
  const [packageDuration, setPackageDuration] = useState<'3 bulan' | '6 bulan' | '1 tahun' | 'free_trial'>('3 bulan');
  const [packagePrice, setPackagePrice] = useState<number>(1500000);

  // Keep packages updated persistently
  useEffect(() => {
    localStorage.setItem('sa_packages', JSON.stringify(packages));
  }, [packages]);

  // Sync automatic price and package name based on selected duration
  useEffect(() => {
    if (packageDuration === 'free_trial') {
      setPackagePrice(0);
      setPackageName('Free Trial');
    } else if (packageDuration === '3 bulan') {
      setPackagePrice(1500000);
      setPackageName('Hemat');
    } else if (packageDuration === '6 bulan') {
      setPackagePrice(3000000);
      setPackageName('Sedang');
    } else if (packageDuration === '1 tahun') {
      setPackagePrice(5000000);
      setPackageName('Tinggi');
    }
  }, [packageDuration]);

  const formatIdr = (n: number) => n === 0 ? 'Free Trial (Gratis)' : 'Rp ' + n.toLocaleString('id-ID');

  // Calculates metrics directly from packages list to keep indicators fully accurate
  const totalKemitraan = packages.length;
  const totalPremiumRevenue = packages.filter(p => p.duration !== 'free_trial').reduce((acc, p) => acc + p.price, 0);
  const totalTrials = packages.filter(p => p.duration === 'free_trial').length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofUrl(reader.result as string);
        setPaymentProofName(file.name);
        showToast(`Bukti transfer "${file.name}" masuk sistem`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Resolve school/schoolName from selection
    let schoolNameResult = '';
    if (selectedTenantNpsn && selectedTenantNpsn !== 'custom') {
      const match = tenants.find(t => t.npsn === selectedTenantNpsn);
      if (match) {
        schoolNameResult = match.name;
      }
    } else {
      if (!customSchoolName.trim()) {
        showToast('Mohon masukkan nama sekolah secara manual');
        return;
      }
      schoolNameResult = customSchoolName.trim();
    }

    if (!packageName.trim()) {
      showToast('Mohon pilih Nama Paket Layanan');
      return;
    }

    const now = new Date();
    let durationDays = 30; // default for trial
    if (packageDuration === '3 bulan') durationDays = 90;
    else if (packageDuration === '6 bulan') durationDays = 180;
    else if (packageDuration === '1 tahun') durationDays = 365;

    const endDateObj = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const createdAtStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const endDateStr = endDateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    if (editingPackageId) {
      setPackages(prev => {
        const next = prev.map(p => {
          if (p.id === editingPackageId) {
            return {
              ...p,
              name: packageName, // "Hemat", "Sedang", "Tinggi"
              schoolName: schoolNameResult, // target school name
              schoolNpsn: selectedTenantNpsn === 'custom' ? undefined : selectedTenantNpsn,
              duration: packageDuration,
              price: packagePrice,
              paymentProofUrl,
              paymentProofName,
              endDate: endDateStr
            };
          }
          return p;
        });
        localStorage.setItem('sa_packages', JSON.stringify(next));
        return next;
      });
      addLog('success', `Paket langganan aktif "${schoolNameResult}" dengan ${packageName} sukses diubah.`);
      showToast(`Paket "${schoolNameResult}" sukses disimpan!`);
      setEditingPackageId(null);
    } else {
      const newPkg: Package = {
        id: 'pkg-' + Date.now(),
        name: packageName, // "Hemat", "Sedang", "Tinggi"
        schoolName: schoolNameResult, // target school name
        schoolNpsn: selectedTenantNpsn === 'custom' ? undefined : selectedTenantNpsn,
        duration: packageDuration,
        price: packagePrice,
        paymentProofUrl,
        paymentProofName,
        createdAt: createdAtStr,
        endDate: endDateStr
      };

      setPackages(prev => {
        const next = [...prev, newPkg];
        localStorage.setItem('sa_packages', JSON.stringify(next));
        return next;
      });
      addLog('success', `Paket baru berhasil ditambahkan untuk ${schoolNameResult}: ${packageName} (${packageDuration})`);
      showToast(`Paket untuk "${schoolNameResult}" sukses disimpan!`);
    }

    // Reset Form fields
    setPackageName('Hemat');
    setCustomSchoolName('');
    setSelectedTenantNpsn('custom');
    setPackageDuration('3 bulan');
    setPaymentProofUrl(undefined);
    setPaymentProofName(undefined);
  };

  const handleEditPackage = (pkg: Package) => {
    setEditingPackageId(pkg.id);
    setPackageName(pkg.name || 'Hemat');
    setSelectedTenantNpsn(pkg.schoolNpsn || 'custom');
    if (!pkg.schoolNpsn) {
      setCustomSchoolName(pkg.schoolName || '');
    } else {
      setCustomSchoolName('');
    }
    setPackageDuration(pkg.duration);
    setPackagePrice(pkg.price);
    setPaymentProofUrl(pkg.paymentProofUrl);
    setPaymentProofName(pkg.paymentProofName);
    showToast(`Edit paket "${pkg.schoolName || 'Paket Umum'}"`);
  };

  const handleCancelEdit = () => {
    setEditingPackageId(null);
    setPackageName('Hemat');
    setCustomSchoolName('');
    setSelectedTenantNpsn('custom');
    setPackageDuration('3 bulan');
    setPaymentProofUrl(undefined);
    setPaymentProofName(undefined);
    showToast('Edit dibatalkan');
  };

  const handleDeletePackage = (pkgId: string, name: string) => {
    setConfirmDelete({ id: pkgId, name: name });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="space-y-8"
    >
      {/* Top statistics summary widget based on Subscription Packages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-tr from-rose-600 to-rose-500 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
          <p className="text-[9px] font-black uppercase tracking-wider opacity-80 mb-2">Total Kemitraan Aktif</p>
          <p className="text-4xl font-black italic tracking-tight mb-2">{totalKemitraan} Sekolah</p>
          <p className="text-[10px] opacity-75 font-bold">Total sekolah mitra aktif saat ini</p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl group-hover:scale-125 transition-transform" />
        </div>

        <div className="bg-slate-900 p-8 border border-slate-800 rounded-[2.5rem] flex flex-col justify-center">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">Total Penerimaan Premium</p>
          <p className="text-3xl font-black italic tracking-tight text-emerald-400">{formatIdr(totalPremiumRevenue)}</p>
          <p className="text-[10px] text-slate-500 font-bold mt-1">Akumulasi pendapatan paket layanan berbayar</p>
        </div>

        <div className="bg-slate-900 p-8 border border-slate-800 rounded-[2.5rem] flex flex-col justify-center">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-2">Free Trial Terdaftar</p>
          <p className="text-3xl font-black italic tracking-tight text-white">{totalTrials} Sekolah</p>
          <p className="text-[10px] text-slate-500 font-bold mt-1">Siswa/Guru dalam masa percobaan gratis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Pane: Manage custom Packages (DIBUAT SEBAGUS MUNGKIN!) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-tr from-slate-900 to-slate-900/95 border border-slate-800 p-6 rounded-[2rem] relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl animate-pulse" />
            
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-4 bg-rose-500 rounded-full" />
              <h4 className="text-white font-black italic text-sm uppercase tracking-wide">
                {editingPackageId ? 'Ubah Paket Layanan' : 'Buat Paket Baru'}
              </h4>
              {editingPackageId && (
                <span className="text-[8px] bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full uppercase font-black">
                  Mode Edit
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 font-bold mb-5 leading-relaxed">
              Pilih sekolah terdaftar atau input manual, tentukan nama paket (Hemat, Sedang, Tinggi), isi bukti transfer jika sudah dibayar, lalu simpan.
            </p>

            <form onSubmit={handleCreatePackage} className="space-y-4">
              {/* School matcher select dropdown */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Pilih Dari Manajemen Tenant</label>
                <select 
                  value={selectedTenantNpsn}
                  onChange={(e) => setSelectedTenantNpsn(e.target.value)}
                  className="w-full h-[46px] px-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-extrabold text-xs text-white"
                >
                  <option value="custom">-- Input Kustom Manual --</option>
                  {tenants.map((t) => (
                    <option key={t.npsn} value={t.npsn}>{t.name} (NPSN: {t.npsn})</option>
                  ))}
                </select>
              </div>

              {/* Custom School Name input shown only when custom is selected */}
              {selectedTenantNpsn === 'custom' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Nama Sekolah (Manual)</label>
                  <input 
                    type="text"
                    placeholder="Contoh: SMP Negeri 1 Banjar Margo"
                    value={customSchoolName}
                    onChange={(e) => setCustomSchoolName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-extrabold text-xs text-white placeholder-slate-600 transition-all border-dashed"
                    required
                  />
                </div>
              )}

              {/* Nama Paket Layanan input select removed as requested */}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Pilih Durasi Paket</label>
                  <select 
                    value={packageDuration}
                    onChange={(e) => setPackageDuration(e.target.value as any)}
                    className="w-full h-[46px] px-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-extrabold text-xs text-white"
                  >
                    <option value="free_trial">Free Trial (gratis)</option>
                    <option value="3 bulan">3 Bulan</option>
                    <option value="6 bulan">6 Bulan</option>
                    <option value="1 tahun">1 Tahun</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Harga Paket (IDR)</label>
                  <div className="h-[46px] flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl font-black text-xs italic tracking-wide">
                    {formatIdr(packagePrice)}
                  </div>
                </div>
              </div>

              {/* Automatic guidelines pricing display info */}
              <div className="p-3 bg-slate-950/60 border border-slate-800/40 rounded-xl text-[10px] text-slate-500 leading-normal font-bold">
                <span className="text-rose-400 font-extrabold">Aturan Tarif:</span> Free Trial = Rp 0, 3 Bulan = Rp 1.5M, 6 Bulan = Rp 3.0M, 1 Tahun = Rp 5.0M.
              </div>

              {/* BANK BRI payment details */}
              <div className="p-4 bg-rose-950/20 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-left">
                <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg shrink-0 mt-0.5">
                  <CreditCard size={18} />
                </div>
                <div className="text-[11px] leading-relaxed">
                  <p className="font-extrabold text-rose-400 uppercase tracking-wider text-[9px]">DIREKTORI REKENING BRI RESMI</p>
                  <p className="text-white mt-1 font-bold">BANK BRI</p>
                  <p className="text-rose-300 font-extrabold text-xs tracking-wider">0605-01-094026-50-9</p>
                  <p className="text-slate-400 mt-0.5 text-[10px]">Atas Nama: <span className="text-slate-200 font-extrabold">Agung Juliyanto</span></p>
                </div>
              </div>

              {/* Upload Bukti TF Manual */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Masukkan Bukti Pembayaran / TF</label>
                <div className="flex items-center gap-3">
                  <label htmlFor="proof-upload" className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl font-bold text-[10px] text-slate-300 hover:text-white transition-all">
                    <Plus size={12} className="text-slate-400" />
                    {paymentProofUrl ? 'Ganti Bukti TF' : 'Pilih Bukti TF'}
                  </label>
                  <input 
                    id="proof-upload"
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {paymentProofName && (
                    <span className="text-[10px] text-slate-400 font-black truncate max-w-[150px]" title={paymentProofName}>
                      ✓ {paymentProofName}
                    </span>
                  )}
                </div>
                {paymentProofUrl && (
                  <div className="mt-2 relative inline-block">
                    <img 
                      src={paymentProofUrl} 
                      alt="Pratinjau Bukti Transfer" 
                      className="w-14 h-14 object-cover rounded-xl border border-slate-800 shadow-lg cursor-pointer hover:opacity-85 transition-opacity"
                      onClick={() => setViewingProofUrl(paymentProofUrl)}
                      title="Klik untuk memperbesar" 
                    />
                    <button 
                      type="button"
                      onClick={() => { setPaymentProofUrl(undefined); setPaymentProofName(undefined); }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold transition-colors"
                      title="Hapus Bukti"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                {editingPackageId && (
                  <button 
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 py-3 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Batal Edit
                  </button>
                )}
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-600/10 active:scale-[0.98]"
                >
                  {editingPackageId ? 'Simpan Perubahan' : 'Simpan Paket'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Pane: List of active packages (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/65 p-5 rounded-3xl border border-slate-800/40">
            <h3 className="text-white font-black italic text-md flex items-center gap-2">
              Daftar Paket Langganan Aktif
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Daftar lisensi paket sekolah aktif terdaftar dalam sistem (Super Admin dapat mengubah atau menghapus secara permanen)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages.length === 0 ? (
              <div className="col-span-full bg-slate-900 p-12 text-center rounded-[2rem] border border-slate-800">
                <CreditCard size={36} className="mx-auto opacity-10 mb-3" />
                <p className="text-sm font-bold uppercase text-slate-500 tracking-wider">Belum ada paket langganan aktif</p>
              </div>
            ) : (
              packages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700/85 transition-all shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                          pkg.duration === 'free_trial'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                            : pkg.duration === '3 bulan'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                            : pkg.duration === '6 bulan'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                        }`}>
                          {pkg.duration === 'free_trial' ? 'Free Trial' : `Durasi: ${pkg.duration}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 z-10">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditPackage(pkg);
                          }}
                          className="p-2 text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-850 border border-slate-800 rounded-xl transition-all shadow-sm"
                          title="Ubah Paket"
                        >
                          <Edit size={13} />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeletePackage(pkg.id, pkg.schoolName || pkg.name);
                          }}
                          className="p-2 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-600 rounded-xl transition-all shadow-sm"
                          title="Hapus Paket Secara Permanen"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Mitra Sekolah</p>
                      <p className="font-extrabold text-white text-sm tracking-wide mt-0.5">{pkg.schoolName || 'Sekolah Umum'}</p>
                    </div>

                    <div className="mt-2.5">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        📅 Berlaku s/d: <span className="text-slate-200 font-black">{pkg.endDate}</span>
                      </p>
                    </div>
                  </div>

                  {/* Transfer proof status display with klik zoom modal link */}
                  <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] text-slate-500 font-black tracking-wider">BUKTI:</span>
                      {pkg.paymentProofUrl ? (
                        <button 
                          onClick={() => setViewingProofUrl(pkg.paymentProofUrl!)}
                          className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-black text-emerald-400 hover:bg-emerald-500/25 transition-all uppercase"
                        >
                          Lihat Bukti
                        </button>
                      ) : (
                        <span className="text-[8px] text-slate-600 italic">Belum Diupload</span>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="font-black text-rose-400 italic text-sm">
                        {formatIdr(pkg.price)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Lightbox popup viewer for bukti tf */}
      {viewingProofUrl && (
        <div 
          onClick={() => setViewingProofUrl(null)} 
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h5 className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Pratinjau Bukti Transfer Pembayaran</h5>
              <button 
                onClick={() => setViewingProofUrl(null)}
                className="text-slate-500 hover:text-white font-extrabold text-xs"
              >
                ✕ Close
              </button>
            </div>
            <img 
              src={viewingProofUrl} 
              alt="Bukti Transfer Detail" 
              className="w-full h-auto max-h-[70vh] object-contain rounded-2xl border border-slate-850 shadow-2xl" 
            />
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto animate-bounce">
              <Trash2 size={24} />
            </div>
            <div>
              <h4 className="text-white font-black uppercase text-sm tracking-wider">Hapus Paket Langganan?</h4>
              <p className="text-[11px] text-slate-400 font-bold mt-1 max-w-xs mx-auto">Apakah Anda yakin ingin menghapus paket "{confirmDelete.name}" secara permanen? Langkah ini tidak dapat dibatalkan.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-705 text-slate-300 rounded-xl text-xs font-bold uppercase transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const { id, name } = confirmDelete;
                  setPackages(prev => {
                    const updated = prev.filter(p => p.id !== id);
                    localStorage.setItem('sa_packages', JSON.stringify(updated));
                    return updated;
                  });
                  addLog('alert', `Super admin menghapus paket langganan secara permanen: ${name}`);
                  showToast('Paket langganan berhasil dihapus secara permanen');
                  setConfirmDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-lg shadow-rose-600/15"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// 4. SECURITY & SYSTEM VIEW PANEL (MAINTENANCE, IP BLOCKING, CACHE)
interface SecurityViewProps {
  blockedIps: BlockedIp[];
  setBlockedIps: React.Dispatch<React.SetStateAction<BlockedIp[]>>;
  maintenanceMode: boolean;
  setMaintenanceMode: React.Dispatch<React.SetStateAction<boolean>>;
  addLog: (type: 'info' | 'warn' | 'success' | 'alert', text: string) => void;
  showToast: (msg: string) => void;
  key?: string;
}

function SecurityView({ blockedIps, setBlockedIps, maintenanceMode, setMaintenanceMode, addLog, showToast }: SecurityViewProps) {
  const [inputIp, setInputIp] = useState('');
  const [inputReason, setInputReason] = useState('');
  
  // Simulated System metrics changing live
  const [cpuUsage, setCpuUsage] = useState(24);
  const [memoryUsage, setMemoryUsage] = useState(62);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 8) + 20); // 20% to 28%
      setMemoryUsage(60 + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2));
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const toggleMaintenance = async () => {
    const nextState = !maintenanceMode;
    const msg = localStorage.getItem('sa_maintenance_msg') || 'Maaf, Sistem Sedang Dalam Pemeliharaan Berkala. Kami akan kembali dalam 45 menit.';
    try {
      const docRef = doc(db, 'settings', 'school');
      await updateDoc(docRef, {
        isMaintenanceActive: nextState,
        maintenanceMessage: msg
      });
      setMaintenanceMode(nextState);
      addLog('alert', `Super admin mengubah status Maintenance Mode ke: ${nextState ? 'AKTIF' : 'NON-AKTIF'}`);
      showToast(nextState ? 'Sistem resmi masuk mode maintenance' : 'Sistem kembali normal online');
    } catch (err) {
      console.error("Gagal menyinkronkan status pemeliharaan ke database:", err);
      setMaintenanceMode(nextState);
      showToast('Koneksi terhambat, status diperbarui secara lokal.');
    }
  };

  const handleBlockIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputIp || !inputReason) {
      alert('Mohon lengkapi alamat IP dan alasan blokir');
      return;
    }
    const newIp: BlockedIp = {
      ip: inputIp,
      reason: inputReason,
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };
    setBlockedIps(prev => [newIp, ...prev]);
    addLog('alert', `Blokir IP baru terdaftar: ${inputIp} - ${inputReason}`);
    showToast(`IP ${inputIp} berhasil diblokir`);
    setInputIp('');
    setInputReason('');
  };

  const handleUnblockIp = (ipToUnblock: string) => {
    setBlockedIps(prev => prev.filter(item => item.ip !== ipToUnblock));
    addLog('success', `Blokir IP dilepas: ${ipToUnblock}`);
    showToast(`IP ${ipToUnblock} diizinkan kembali`);
  };

  const handleClearCache = () => {
    setIsClearing(true);
    setTimeout(() => {
      setIsClearing(false);
      addLog('success', 'Pembersihan app cache & CDN temporer selesai dilakukan.');
      showToast('Cache CDN dibersihkan');
    }, 2000);
  };

  const handleOptimizeDatabase = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      addLog('success', 'Defragmentasi tumpukan log database Firestore & PostgreSQL selesai.');
      showToast('Optimasi database berhasil');
    }, 2500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Core Engine Status */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 relative overflow-hidden group">
          <h3 className="text-slate-400 font-extrabold text-[10px] uppercase tracking-[0.2em] mb-4">Core Keamanan Server</h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-rose-600/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 shadow-xl">
              <ShieldAlert size={28} className="animate-pulse" />
            </div>
            <div>
              <p className="text-white font-black italic text-2xl">TERAMANKAN</p>
              <p className="text-emerald-400 font-black text-[9px] uppercase tracking-widest mt-0.5">TLS Enkripsi Aktif</p>
            </div>
          </div>
          <p className="text-slate-400 text-[11px] font-bold leading-relaxed">
            Sistem firewall aktif dengan pembatasan bypass lokasi. Percobaan akses ganda akan diblokir otomatis.
          </p>
        </div>

        {/* Real-time System Usage */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800">
          <h3 className="text-slate-400 font-extrabold text-[10px] uppercase tracking-[0.2em] mb-6">Beban Sumber Daya Real-Time</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 font-extrabold text-xs">Utilisasi CPU AWS</span>
                <span className="text-rose-400 font-black text-xs italic">{cpuUsage}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div style={{ width: `${cpuUsage}%` }} className="h-full bg-rose-500 transition-all duration-1000" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 font-extrabold text-xs">Alokasi RAM VPS</span>
                <span className="text-indigo-400 font-black text-xs italic">{memoryUsage}%</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div style={{ width: `${memoryUsage}%` }} className="h-full bg-indigo-500 transition-all duration-1000" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Database actions */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 flex flex-col justify-between">
          <h3 className="text-slate-400 font-extrabold text-[10px] uppercase tracking-[0.2em] mb-4">Konsol Pemeliharaan</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleClearCache}
              disabled={isClearing}
              className="px-4 py-3 bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-600 rounded-xl font-black text-[10px] uppercase tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              <RefreshCw size={12} className={isClearing ? 'animate-spin' : ''} />
              {isClearing ? 'Clearing...' : 'Clear Cache'}
            </button>
            <button 
              onClick={handleOptimizeDatabase}
              disabled={isOptimizing}
              className="px-4 py-3 bg-slate-950 text-emerald-400 border border-slate-800 hover:border-emerald-500/40 rounded-xl font-black text-[10px] uppercase tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              <Cpu size={12} className={isOptimizing ? 'animate-bounce' : ''} />
              {isOptimizing ? 'Optimizing...' : 'Db Optimize'}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 font-bold mt-4 leading-relaxed text-center">
            Disarankan pemeliharaan malam hari untuk menghindari overhead transaksi absensi.
          </p>
        </div>

      </div>

      {/* Maintenance Mode & IP Access Block Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Maintenance Toggle */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-6 flex flex-col justify-between">
          <div>
            <h4 className="text-white font-black italic text-lg mb-2">Grup Kontrol Status Maintenance</h4>
            <p className="text-slate-400 text-xs leading-relaxed font-bold">
              Saat diaktifkan, seluruh platform absensi pada tenant klien (web dan mobile apps) akan menampilkan halaman maintenance terpadu sementara waktu untuk pembaruan atau perbaikan besar API.
            </p>
          </div>

          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-rose-500">Masa Pemeliharaan Menyeluruh</p>
              <p className="text-[10px] text-slate-500 font-bold mt-1">Status saat ini: {maintenanceMode ? 'AKTIF (Situs Ditangguhkan)' : 'NORMAL ACCESS (Online)'}</p>
            </div>
            <button 
              onClick={toggleMaintenance}
              className={`px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all border outline-none ${
                maintenanceMode 
                  ? 'bg-rose-600 text-white border-rose-500 hover:bg-rose-700' 
                  : 'bg-slate-900 text-rose-400 border-rose-500/20 hover:border-rose-500'
              }`}
            >
              Mode {maintenanceMode ? 'Selesai' : 'Aktifkan'}
            </button>
          </div>
        </div>

        {/* IP Blocking panel */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-6">
          <h4 className="text-white font-black italic text-lg">Sensor Pemblokiran IP Address (Block List)</h4>
          
          <form onSubmit={handleBlockIp} className="flex gap-3">
            <input 
              type="text" 
              placeholder="IP (Contoh: 114.122.31.25)"
              value={inputIp}
              onChange={(e) => setInputIp(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold text-xs text-white"
              required
            />
            <input 
              type="text" 
              placeholder="Alasan Blokir"
              value={inputReason}
              onChange={(e) => setInputReason(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold text-xs text-white"
              required
            />
            <button 
              type="submit"
              className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider shrink-0 transition-colors"
            >
              Blok IP
            </button>
          </form>

          {/* Block list */}
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {blockedIps.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Belum ada IP terekam di daftar hitam firewall</p>
            ) : (
              blockedIps.map((b) => (
                <div key={b.ip} className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-xs font-black text-slate-100">{b.ip}</p>
                    <p className="text-[10px] text-rose-400 font-bold tracking-tight mt-0.5 truncate">{b.reason}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[9px] text-slate-600 font-bold">{b.date}</span>
                    <button 
                      onClick={() => handleUnblockIp(b.ip)}
                      className="text-[9px] font-black uppercase text-emerald-400 hover:text-emerald-300 transition-colors bg-slate-900 border border-slate-800 px-2 py-1 rounded"
                    >
                      Buka
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}

// 5. BROADCAST ANNOUNCEMENT PANEL
interface BroadcastViewProps {
  broadcasts: Broadcast[];
  setBroadcasts: React.Dispatch<React.SetStateAction<Broadcast[]>>;
  addLog: (type: 'info' | 'warn' | 'success' | 'alert', text: string) => void;
  showToast: (msg: string) => void;
  maintenanceMode: boolean;
  setMaintenanceMode: React.Dispatch<React.SetStateAction<boolean>>;
  key?: string;
}

function BroadcastView({ broadcasts, setBroadcasts, addLog, showToast, maintenanceMode, setMaintenanceMode }: BroadcastViewProps) {
  const [bTitle, setBTitle] = useState('');
  const [bMessage, setBMessage] = useState('');
  const [bTarget, setBTarget] = useState<'all' | 'enterprise' | 'free'>('all');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);

  // Maintenance and Timer Configuration States
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [activeEndTime, setActiveEndTime] = useState<number | null>(null);
  const [adminTimeLeft, setAdminTimeLeft] = useState<number>(0);

  const [maintText, setMaintText] = useState(() => {
    return localStorage.getItem('sa_maintenance_msg') || 'Maaf, Sistem Sedang Dalam Pemeliharaan Berkala. Kami akan kembali dalam 45 menit.';
  });

  // Fetch actual target endTime from database on component initialization or maintenanceToggle
  useEffect(() => {
    const fetchTargetTime = async () => {
      try {
        const docRef = doc(db, 'settings', 'school');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.maintenanceEndTime) {
            setActiveEndTime(data.maintenanceEndTime);
          } else {
            setActiveEndTime(null);
          }
        }
      } catch (err) {
        console.error("Gagal menyinkronkan target timer:", err);
      }
    };
    fetchTargetTime();
  }, [maintenanceMode]);

  // Real-time local ticking and auto-expiry management in Super Admin
  useEffect(() => {
    if (!maintenanceMode || !activeEndTime) {
      setAdminTimeLeft(0);
      return;
    }

    const calcLeft = () => {
      const remainingMs = activeEndTime - Date.now();
      return Math.max(0, Math.floor(remainingMs / 1000));
    };

    setAdminTimeLeft(calcLeft());

    const timer = setInterval(() => {
      const left = calcLeft();
      setAdminTimeLeft(left);
      if (left <= 0) {
        clearInterval(timer);
        handleAutoExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [maintenanceMode, activeEndTime]);

  const handleAutoExpire = async () => {
    try {
      const docRef = doc(db, 'settings', 'school');
      await updateDoc(docRef, {
        isMaintenanceActive: false,
        maintenanceEndTime: null
      });
      setMaintenanceMode(false);
      setActiveEndTime(null);
      addLog('success', 'Masa pemeliharaan berjangka telah berakhir. Sistem otomatis kembali normal!');
      showToast('Masa pemeliharaan usai! Sistem dilepas otomatis.');
    } catch (err) {
      console.error("Gagal memproses auto-expire pemeliharaan:", err);
    }
  };

  const formatLeftTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (v: number) => String(v).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bTitle || !bMessage) {
      showToast('Mohon lengkapi judul dan teks pengumuman');
      return;
    }

    const idNum = Date.now().toString();
    const bcId = 'BC-' + idNum;

    const newBroadcast: Broadcast = {
      id: bcId,
      title: bTitle,
      message: bMessage,
      target: bTarget,
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      reads: Math.floor(Math.random() * 20) + 120 // Simulated initial reach
    };

    // Store in Firestore notifications collection
    try {
      await setDoc(doc(db, 'notifications', bcId), {
        id: bcId,
        title: `[BROADCAST] ${bTitle}`,
        message: bMessage,
        date: new Date().toISOString(),
        isRead: false,
        type: 'announcement'
      });
    } catch (err) {
      console.error("Gagal mendistribusikan pesan broadcast ke Firestore:", err);
    }

    setBroadcasts(prev => [newBroadcast, ...prev]);
    addLog('info', `Pesan Broadcast Massal diterbitkan: "${bTitle}"`);
    showToast('Broadcast berhasil didistribusikan ke seluruh sekolah!');
    setBTitle('');
    setBMessage('');
  };

  const handleDeleteBroadcast = (id: string, title: string) => {
    setConfirmDelete({ id, title });
  };

  const handleToggleMaintenanceWithNotice = async () => {
    const nextState = !maintenanceMode;
    const targetEndTime = nextState ? (Date.now() + durationMinutes * 60 * 1000) : null;
    
    // Save current customized message in localStorage
    localStorage.setItem('sa_maintenance_msg', maintText);
    
    // Sync into shared Firestore settings/school configuration document to activate client locks instantly
    try {
      const docRef = doc(db, 'settings', 'school');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          isMaintenanceActive: nextState,
          maintenanceMessage: maintText,
          maintenanceEndTime: targetEndTime
        });
      } else {
        await setDoc(docRef, {
          radius: 100,
          center: { lat: -6.2088, lng: 106.8456 },
          locationName: 'SMP Negeri 1 Banjar Margo',
          runningText: 'Selamat Datang di Aplikasi Absensi Digital SMP Negeri 1 Banjar Margo',
          workHours: {
            entryStart: '06:30',
            entryEnd: '08:00',
            exitStart: '15:00',
            exitEnd: '17:00'
          },
          isMaintenanceActive: nextState,
          maintenanceMessage: maintText,
          maintenanceEndTime: targetEndTime
        });
      }

      setMaintenanceMode(nextState);
      setActiveEndTime(targetEndTime);
      addLog('alert', `Super admin mengubah status Maintenance ke: ${nextState ? 'AKTIF' : 'NON-AKTIF'} selama ${durationMinutes} menit dengan pesan: "${maintText}"`);
      showToast(nextState ? `Sakelar gangguan diaktifkan selama ${durationMinutes} menit. Seluruh admin sekolah dikunci!` : 'Sistem kembali online normal');
    } catch (err) {
      console.error("Gagal menyinkronkan status pemeliharaan ke database:", err);
      setMaintenanceMode(nextState);
      showToast('Koneksi terhambat, status diperbarui secara lokal.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Broadcast Form Card */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-rose-600 to-rose-400 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Megaphone size={28} />
          </div>
          <div>
            <h3 className="text-white font-black italic text-xl tracking-wide">Kirim Pengumuman Broadcast Massal</h3>
            <p className="text-xs text-slate-400 font-bold">Informasi akan didelegasikan secara real-time di seluruh dasbor administratator sekolah klien.</p>
          </div>
        </div>

        <form onSubmit={handleSendBroadcast} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Target Segmentasi Sekolah</label>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                {['all', 'enterprise', 'free'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBTarget(t as any)}
                    className={`flex-1 py-2 rounded-lg text-[9px] font-extrabold uppercase tracking-widest transition-all ${
                      bTarget === t ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t === 'all' ? 'Semua' : t === 'enterprise' ? 'Enterprise' : 'Trial'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Judul Informasi (Broadcast Title)</label>
              <input 
                type="text" 
                placeholder="Contoh: Pemeliharaan Server Database 20 Mei"
                value={bTitle}
                onChange={(e) => setBTitle(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold text-xs text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Konten Pesan Informasi Lengkap</label>
            <textarea 
              placeholder="Tulis detail rincian pengumuman di sini..."
              value={bMessage}
              onChange={(e) => setBMessage(e.target.value)}
              className="w-full h-36 p-5 bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold text-xs text-white placeholder:text-slate-600 shadow-inner resize-none leading-relaxed"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/10 active:scale-[0.99] transition-all"
          >
            <Megaphone size={16} />
            Publish & Kirim Pesan Massal
          </button>
        </form>
      </div>

      {/* EMERGENCY SAKELAR GANGGUAN MAINTENANCE FOR ADMIN SEKOLAH */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-600 to-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h3 className="text-white font-black italic text-xl tracking-wide">Sakelar Darurat Gangguan Sistem</h3>
            <p className="text-xs text-slate-400 font-bold">Mengunci seluruh akses admin sekolah dan mengubah layar aplikasi langsung menjadi gelap dengan mode pemeliharaan otomatis.</p>
          </div>
        </div>

        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pesan Pengumuman Pemeliharaan (Oleh Superadmin)</label>
            <textarea 
              placeholder="Masukkan tulisan oleh Superadmin..."
              value={maintText}
              onChange={(e) => {
                setMaintText(e.target.value);
                localStorage.setItem('sa_maintenance_msg', e.target.value);
              }}
              className="w-full h-24 p-4 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold text-xs text-white placeholder:text-slate-600 shadow-inner resize-none leading-relaxed"
            />
          </div>

          {/* Configurable Maintenance Duration Timer (Preset / Custom Selector) */}
          <div className="space-y-2.5 border-t border-slate-800 pt-3">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Durasi Pemeliharaan Otomatis (Timer)</label>
            <div className="flex flex-wrap gap-2">
              {[5, 15, 30, 45, 60, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  disabled={maintenanceMode}
                  onClick={() => setDurationMinutes(mins)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                    durationMinutes === mins
                      ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/20'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  } ${maintenanceMode ? 'opacity-40 cursor-not-allowed border-dashed' : ''}`}
                >
                  {mins} Menit
                </button>
              ))}
              <button
                type="button"
                disabled={maintenanceMode}
                onClick={() => setDurationMinutes(0)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                  ![5, 15, 30, 45, 60, 120].includes(durationMinutes)
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                } ${maintenanceMode ? 'opacity-40 cursor-not-allowed border-dashed' : ''}`}
              >
                Custom
              </button>
            </div>

            {/* If custom is active, show the field */}
            {![5, 15, 30, 45, 60, 120].includes(durationMinutes) && (
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  disabled={maintenanceMode}
                  placeholder="Masukkan menit..."
                  value={durationMinutes === 0 ? '' : durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value)))}
                  className="w-36 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold text-xs text-white"
                />
                <span className="text-xs font-bold text-slate-500">Menit Berjangka</span>
              </div>
            )}
          </div>

          {/* Real-time Ticking Countdown Indicator for Super Admin */}
          {maintenanceMode && activeEndTime && adminTimeLeft > 0 && (
            <div className="p-4 bg-rose-550/10 border border-rose-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold text-rose-300">
                  Status: Pemeliharaan Sedang Tembus Sandi. Selesai Otomatis Dalam:
                </span>
              </div>
              <div className="font-mono text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400">
                {formatLeftTime(adminTimeLeft)}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-850">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status Sakelar:</span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${maintenanceMode ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'}`} />
                <span className={`text-xs font-black uppercase ${maintenanceMode ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
                  {maintenanceMode ? 'MODE GANGGUAN AKTIF (LOCKED)' : 'MODE NORMAL ONLINE'}
                </span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleToggleMaintenanceWithNotice}
              className={`px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-md flex items-center gap-2 active:scale-95 ${
                maintenanceMode 
                  ? 'bg-slate-800 hover:bg-slate-705 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/10'
              }`}
            >
              <ShieldAlert size={16} />
              {maintenanceMode ? 'Matikan Sakelar Gangguan (Kembali Normal)' : 'Mengaktifkan Sakelar Gangguan'}
            </button>
          </div>
        </div>
      </div>

      {/* Broadcast History Row */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem]">
        <h4 className="text-white font-black italic text-md mb-6">Histori Pengiriman Broadcast</h4>
        
        <div className="space-y-4">
          {broadcasts.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Tidak ada riwayat broadcast terkirim</p>
          ) : (
            broadcasts.map((b) => (
              <div key={b.id} className="p-5 bg-slate-950 border border-slate-850/80 rounded-2xl relative group hover:border-slate-800 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">IP ID: {b.id}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Target: {b.target.toUpperCase()}
                    </span>
                    <button 
                      onClick={() => handleDeleteBroadcast(b.id, b.title)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                      title="Hapus Histori"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <h5 className="text-slate-100 font-extrabold text-sm mb-1.5">{b.title}</h5>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">{b.message}</p>
                
                <div className="mt-4 flex items-center gap-4 border-t border-slate-900 pt-3 text-[10px] text-slate-500 font-bold">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {b.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={12} />
                    Terkirim ke {b.reads} Sekolah
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto animate-bounce">
              <Trash2 size={24} />
            </div>
            <div>
              <h4 className="text-white font-black uppercase text-sm tracking-wider">Hapus Broadcast?</h4>
              <p className="text-[11px] text-slate-400 font-bold mt-1 max-w-xs mx-auto">Apakah Anda yakin menghapus histori broadcast "{confirmDelete.title}"?</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-705 text-slate-300 rounded-xl text-xs font-bold uppercase transition-all"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  const { id, title } = confirmDelete;
                  try {
                    await deleteDoc(doc(db, 'notifications', id));
                  } catch (err) {
                    console.error("Gagal menghapus broadcast dari Firestore:", err);
                  }
                  setBroadcasts(prev => prev.filter(b => b.id !== id));
                  addLog('warn', `Super admin menghapus riwayat broadcast: ${title}`);
                  showToast('Broadcast dihapus dari history');
                  setConfirmDelete(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-lg shadow-rose-600/15"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
