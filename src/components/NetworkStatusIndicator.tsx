import { useState, useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showRestored, setShowRestored] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      // Automatically dismiss the "Connected" notification after 3 seconds
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-[99999] pointer-events-none w-[90%] max-w-sm md:w-80">
      <AnimatePresence mode="wait">
        {/* Offline Notification */}
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="pointer-events-auto w-full bg-slate-900/95 backdrop-blur-md border border-amber-500/20 rounded-2xl p-4 shadow-xl shadow-amber-500/5 flex items-start gap-3.5"
            id="network-offline-badge"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 text-amber-500 animate-pulse">
              <WifiOff size={18} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">Modus Offline</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              </div>
              <h4 className="text-[12.5px] font-extrabold text-white leading-tight mt-0.5">Koneksi Internet Terputus</h4>
              <p className="text-[10.5px] font-semibold text-slate-300 leading-normal mt-1">
                Jangan khawatir! Absensi dan aktivitas Anda disimpan di cache lokal & otomatis tersinkron saat kembali online.
              </p>
            </div>
          </motion.div>
        )}

        {/* Online Connection Restored Notification */}
        {isOnline && showRestored && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="pointer-events-auto w-full bg-slate-900/95 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-4 shadow-xl shadow-emerald-500/5 flex items-start gap-3.5"
            id="network-online-badge"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 text-emerald-500">
              <CheckCircle2 size={18} strokeWidth={2.5} className="animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Online</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <h4 className="text-[12.5px] font-extrabold text-white leading-tight mt-0.5">Koneksi Kembali Stabil</h4>
              <p className="text-[10.5px] font-semibold text-slate-300 leading-normal mt-1">
                Data lokal Anda kini sedang disinkronkan sepenuhnya dengan Cloud Firestore.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
