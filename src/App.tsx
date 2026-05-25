/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import MobileWrapper from './components/MobileWrapper';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Absensi from './pages/Absensi';
import History from './pages/History';
import Izin from './pages/Izin';
import Lembur from './pages/Lembur';
import Shift from './pages/Shift';
import Kalender from './pages/Kalender';
import ProfilSekolah from './pages/ProfilSekolah';
import MediaPembelajaran from './pages/MediaPembelajaran';
import LeaveHistory from './pages/LeaveHistory';
import OvertimeHistory from './pages/OvertimeHistory';
import ShiftHistory from './pages/ShiftHistory';
import News from './pages/News';
import Aktivitas from './pages/Aktivitas';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Profile from './pages/Profile';
import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import { motion, AnimatePresence } from 'motion/react';
import PWAInstallBanner from './components/PWAInstallBanner';
import NetworkStatusIndicator from './components/NetworkStatusIndicator';

function AppContent() {
  const { user, loading, settings } = useApp();
  const [splashComplete, setSplashComplete] = useState(false);
  const location = useLocation();

  const publicRoutes = ['/login', '/super-admin'];
  const isPublicRoute = publicRoutes.includes(location.pathname);
  const isSuperAdmin = localStorage.getItem('userRole') === 'super-admin';

  // Real-time maintenance countdown checker & state
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!settings?.isMaintenanceActive || !settings?.maintenanceEndTime) {
      setTimeLeft(0);
      return;
    }

    const calcRemaining = () => {
      const remainingMs = settings.maintenanceEndTime! - Date.now();
      return Math.max(0, Math.floor(remainingMs / 1000));
    };

    // Initial check
    const initialVal = calcRemaining();
    setTimeLeft(initialVal);

    const timer = setInterval(() => {
      const currentVal = calcRemaining();
      setTimeLeft(currentVal);
      if (currentVal <= 0) {
        clearInterval(timer);
        // Automatically disable maintenance status locally & trigger a dynamic refresh
        try {
          // Soft unlock of client state
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (e) {
          console.error(e);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [settings?.isMaintenanceActive, settings?.maintenanceEndTime]);

  const isMaintenanceCurrentlyActive = settings?.isMaintenanceActive && (
    !settings?.maintenanceEndTime || settings.maintenanceEndTime > Date.now()
  );

  const formatTimeLeft = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  };

  if (splashComplete && isMaintenanceCurrentlyActive && !isSuperAdmin && !isPublicRoute && user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-white font-sans select-none relative overflow-hidden">
        {/* Abstract futuristic grid and glow backdrops */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-10 md:p-12 shadow-2xl relative overflow-hidden z-10 text-center"
        >
          {/* Pulsing Wrench Logo Shield container */}
          <div className="mx-auto w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-rose-600 to-amber-500 p-[1px] shadow-lg shadow-rose-500/10 mb-8">
            <div className="w-full h-full bg-slate-950 rounded-[2rem] flex items-center justify-center text-rose-500">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </motion.div>
            </div>
          </div>

          <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-6 inline-block">
            Pemeliharaan Server Utama (Maintenance)
          </span>

          <h2 className="text-2xl md:text-3xl font-black italic tracking-wide text-white uppercase leading-tight">
            SISTEM SEDANG DIPELIHARA
          </h2>

          <div className="w-20 h-[3px] bg-gradient-to-r from-rose-600 to-amber-500 mx-auto my-6 rounded-full" />

          {/* Core Notice Message */}
          <p className="text-slate-200 text-sm md:text-base font-semibold leading-relaxed max-w-md mx-auto mb-6">
            {settings?.maintenanceMessage || "Maaf, Sistem Sedang Dalam Pemeliharaan Berkala. Kami akan kembali sesaat lagi."}
          </p>

          {/* New Live Countdown Timer UI Block */}
          {settings?.maintenanceEndTime && timeLeft > 0 && (
            <div className="my-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 inline-block px-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block mb-1">
                Sistem Kembali Normal Dalam
              </span>
              <div className="font-mono text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-500">
                {formatTimeLeft(timeLeft)}
              </div>
            </div>
          )}

          <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-sm mx-auto">
            Semua input formulir, klik tombol, dan sinkronisasi data telah dikunci sepenuhnya oleh manajemen Super Admin untuk menjamin keaslian, keamanan, serta integritas basis data.
          </p>

          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              STATUS DATABASE: LOCKED
            </span>
            <span className="text-[10px] font-black text-rose-400/90 tracking-widest uppercase italic">
              MULTI-TENANT ABSENSI V3.0
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (splashComplete && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (splashComplete && !user && !isPublicRoute) {
    return <Navigate to="/login" replace />;
  }

  const hideNav = [
    '/login',
    '/admin',
    '/super-admin',
    '/absensi', 
    '/izin',
    '/lembur', 
    '/shift', 
    '/kalender', 
    '/profil-sekolah', 
    '/media-pembelajaran',
    '/berita',
    '/aktivitas',
    '/history/izin',
    '/history/lembur',
    '/history/shift',
    '/profile'
  ].includes(location.pathname);

  return (
    <>
      <PWAInstallBanner />
      <NetworkStatusIndicator />
      <AnimatePresence mode="wait">
        {!splashComplete && (
          <SplashScreen key="splash" onComplete={() => { setSplashComplete(true); }} />
        )}
      </AnimatePresence>

      {splashComplete && (
        isSuperAdmin ? (
          <div className="h-screen w-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white overflow-hidden">
            <Routes>
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="*" element={<Navigate to="/super-admin" replace />} />
            </Routes>
          </div>
        ) : (
          <MobileWrapper hasPadding={!hideNav}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={user?.role === 'admin' ? <Navigate to="/admin" replace /> : <Dashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/super-admin" element={<Navigate to="/login" replace />} />
              <Route path="/absensi" element={<Absensi />} />
              <Route path="/history" element={<History />} />
              <Route path="/izin" element={<Izin />} />
              <Route path="/lembur" element={<Lembur />} />
              <Route path="/shift" element={<Shift />} />
              <Route path="/kalender" element={<Kalender />} />
              <Route path="/profil-sekolah" element={<ProfilSekolah />} />
              <Route path="/media-pembelajaran" element={<MediaPembelajaran />} />
              <Route path="/berita" element={<News />} />
              <Route path="/aktivitas" element={<Aktivitas />} />
              <Route path="/history/izin" element={<LeaveHistory />} />
              <Route path="/history/lembur" element={<OvertimeHistory />} />
              <Route path="/history/shift" element={<ShiftHistory />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
            {!hideNav && <Navigation />}
          </MobileWrapper>
        )
      )}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  );
}
