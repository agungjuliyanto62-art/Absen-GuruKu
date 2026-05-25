import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { 
  User, 
  Lock, 
  ArrowRight, 
  Fingerprint,
  Info,
  Eye,
  EyeOff,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<'guru' | 'admin'>('guru');
  const [superAdminClicks, setSuperAdminClicks] = useState(0);
  const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, schoolProfile } = useApp();
  const navigate = useNavigate();

  // Custom high-security Brute-Force lockout
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  useEffect(() => {
    const checkLockout = () => {
      const lockoutUntil = localStorage.getItem('absen_login_lockout_until');
      if (lockoutUntil) {
        const remaining = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 1000);
        if (remaining > 0) {
          setLockoutRemaining(remaining);
        } else {
          setLockoutRemaining(0);
        }
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const incrementFailedAttempts = () => {
    const currentAttempts = parseInt(localStorage.getItem('absen_login_failed_attempts') || '0') + 1;
    localStorage.setItem('absen_login_failed_attempts', currentAttempts.toString());
    
    if (currentAttempts >= 5) {
      const lockoutTime = Date.now() + 60000; // 60 seconds lockout
      localStorage.setItem('absen_login_lockout_until', lockoutTime.toString());
      setLockoutRemaining(60);
      localStorage.setItem('absen_login_failed_attempts', '0');
      setError('Sistem mendeteksi aktivitas mencurigakan. Form masuk diblokir selama 60 detik.');
    } else {
      setError(`ID atau Password tidak valid. Percobaan tersisa sebelum diblokir: ${5 - currentAttempts}`);
    }
  };

  const handleAdminToggle = () => {
    if (loginMode === 'admin') {
      const newClicks = superAdminClicks + 1;
      setSuperAdminClicks(newClicks);
      if (newClicks >= 3) {
        setIsSuperAdminMode(true);
        setEmployeeId('');
        setPassword('');
        setError('');
      }
    } else {
      setLoginMode('admin');
      setSuperAdminClicks(0);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lockoutRemaining > 0) {
      setError(`Sistem dikunci akibat proteksi keamanan. Silakan coba lagi dalam ${lockoutRemaining} detik.`);
      return;
    }

    setIsLoading(true);
    setError('');

    // Input Sanitization to protect against malformed payloads & strings
    const sanitizedEmployeeId = employeeId.trim().replace(/['"$;{}]/g, '');
    const sanitizedPassword = password.trim();

    if (sanitizedEmployeeId !== employeeId.trim()) {
      incrementFailedAttempts();
      setError('Karakter tidak sah terdeteksi pada ID Anda.');
      setIsLoading(false);
      return;
    }

    // Super Admin Credentials Check
    if (isSuperAdminMode) {
      if (sanitizedEmployeeId === '020798' && sanitizedPassword === '12345') {
        localStorage.setItem('absen_login_failed_attempts', '0');
        localStorage.setItem('userRole', 'super-admin');
        navigate('/super-admin');
        return;
      } else {
        incrementFailedAttempts();
        setIsLoading(false);
        return;
      }
    }

    try {
      const success = await login(sanitizedEmployeeId, sanitizedPassword, loginMode === 'guru' ? 'teacher' : 'admin');
      if (success) {
        localStorage.setItem('absen_login_failed_attempts', '0');
        navigate('/');
      } else {
        incrementFailedAttempts();
      }
    } catch (err) {
      setError('Terjadi kesalahan pada koneksi sistem keamanan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full -mr-64 -mt-64 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full -ml-64 -mb-64 blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-[3rem] p-6 md:p-8 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)] border border-slate-100 relative z-10"
      >
        <div className="flex flex-col items-center mb-5 pt-2">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 mb-2 relative"
          >
            <div className={`absolute inset-0 blur-3xl rounded-full transition-colors duration-500 ${
              loginMode === 'admin' ? 'bg-indigo-600/20' : 'bg-primary/20'
            }`} />
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-full h-full relative z-10 ${loginMode === 'admin' ? 'text-indigo-600' : 'text-primary'}`}>
              <path 
                d="M50 10C27.9 10 10 27.9 10 50C10 72.1 27.9 90 50 90C72.1 90 90 72.1 90 50" 
                stroke="white" 
                strokeWidth="2" 
              />
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                d="M50 85 C30.67 85 15 69.33 15 50 C15 30.67 30.67 15 50 15 C69.33 15 85 30.67 85 50 C85 58 82.3 65.4 77.7 71.2 L64 57.5 M50 70 C39 70 30 61.1 30 50 C30 38.9 38.9 30 50 30 C61.1 30 70 38.9 70 50 C70 55.5 67.8 60.5 64.1 64.1 M50 55 C47.2 55 45 52.8 45 50 C45 47.2 47.2 45 50 45" 
                stroke="currentColor" 
                strokeWidth="8" 
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
          <div className="relative overflow-hidden px-2 py-1 w-full flex justify-center">
            <h1 className="text-lg font-black text-slate-800 italic tracking-wider uppercase text-center mb-0 transition-colors duration-500 relative z-10">
              {isSuperAdminMode ? (
                <span className="text-rose-600 animate-pulse">Super Admin</span>
              ) : (
                <>Absen <span className={loginMode === 'admin' ? 'text-indigo-600' : 'text-primary'}>GuruKu</span></>
              )}
            </h1>
            
            {/* Moving Light Line Effect (Slowed down) */}
            <motion.div 
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
              initial={{ x: '-150%' }}
              animate={{ 
                x: ['-150%', '150%'],
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                repeatDelay: 2,
                ease: "linear",
              }}
            >
              <div className="w-[40%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-20" />
            </motion.div>
          </div>
          <p className="text-[10px] uppercase font-black tracking-[0.35em] text-slate-400 mt-2">{schoolProfile.name}</p>
        </div>

        {/* Login Mode Toggle */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mb-6 relative">
          <button 
            type="button"
            onClick={() => {
              setLoginMode('guru');
              setIsSuperAdminMode(false);
              setSuperAdminClicks(0);
              setEmployeeId('');
              setPassword('');
              setError('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[1.1rem] text-[10px] font-black uppercase tracking-wider transition-all z-10 ${
              loginMode === 'guru' ? 'text-white' : 'text-slate-400'
            }`}
          >
            <GraduationCap size={14} />
            Guru
          </button>
          <button 
            type="button"
            onClick={handleAdminToggle}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[1.1rem] text-[10px] font-black uppercase tracking-wider transition-all z-10 ${
              loginMode === 'admin' ? 'text-white' : 'text-slate-400'
            }`}
          >
            <ShieldCheck size={14} />
            Admin
          </button>
          <motion.div 
            layout
            animate={{ x: loginMode === 'guru' ? 0 : '100%' }}
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-[1.1rem] shadow-lg shadow-black/5 ${
              loginMode === 'admin' ? 'bg-indigo-600' : 'bg-primary'
            }`}
          />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
              {isSuperAdminMode ? 'Super Admin ID' : (loginMode === 'guru' ? 'ID NIP / NUPTK' : 'NPSN Sekolah')}
            </label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                maxLength={32}
                placeholder={isSuperAdminMode ? 'Input ID Super...' : (loginMode === 'guru' ? 'Contoh: 12345' : 'Masukkan NPSN...')}
                className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all font-bold placeholder:text-slate-300 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={32}
                placeholder="••••••"
                className="w-full pl-14 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all font-bold placeholder:text-slate-300 text-sm"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-rose-50 text-rose-600 px-6 py-4 rounded-[1.5rem] text-xs font-bold flex items-center gap-3 border border-rose-100 mb-2">
                  <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                    <Info size={14} />
                  </div>
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-[1.8rem] text-white font-black text-sm shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 italic group disabled:opacity-70 ${
              isSuperAdminMode ? 'bg-rose-600 shadow-rose-200 hover:bg-rose-700' : (loginMode === 'admin' ? 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700' : 'bg-primary shadow-primary/30 hover:bg-primary/90')
            }`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {isSuperAdminMode ? 'Login Super Admin' : (loginMode === 'admin' ? 'Login Administrator' : 'Masuk')}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-2 pt-2 flex flex-col items-center gap-2 text-center">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-60">
            © 2026 PakAgung Dev. All Rights Reserved.
          </p>
        </div>
      </motion.div>


    </div>
  );
}
