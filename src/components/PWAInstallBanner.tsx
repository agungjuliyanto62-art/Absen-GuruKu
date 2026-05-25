import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      return;
    }

    // 2. Prevent the default automatic browser prompt install dialog triggers
    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const dismissed = sessionStorage.getItem('pwa_banner_dismissed2');
      if (!dismissed) {
        // Trigger banner alert dynamically with a micro delay
        setTimeout(() => setVisible(true), 1500);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);

    // 3. Detect iOS Safari user agents
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    const regularSafari = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('crios') && !ua.includes('fxios');
    setIsIOS(iosDevice);

    if (iosDevice && regularSafari) {
      const dismissed = sessionStorage.getItem('pwa_banner_dismissed2');
      if (!dismissed) {
        setTimeout(() => setVisible(true), 2000);
      }
    }

    // For testing/fallback in case browser does not trigger beforeinstallprompt (like some mobile webview or browsers)
    const dismissed = sessionStorage.getItem('pwa_banner_dismissed2');
    if (!dismissed && !iosDevice) {
      // Force trigger installation notice in other browsers as a helpful fallback
      setTimeout(() => setVisible(true), 4000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('PWA installation accepted by user');
          setVisible(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error triggering PWA prompt:', err);
      }
    } else {
      // Fallback guide/instruction dialog for browsers without raw prompt bindings
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa_banner_dismissed2', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Premium Banner Notification at the ultra-top of the screen */}
      <div className="w-full bg-slate-900 border-b border-sky-500/25 px-4 py-3 text-white font-sans text-xs flex flex-row items-center justify-between gap-4 sticky top-0 z-[99999] shadow-lg shadow-sky-500/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Custom Miniature PWA Logo */}
          <div className="w-9 h-9 flex-shrink-0 bg-slate-950 rounded-xl border border-sky-500/10 flex items-center justify-center p-1.5 shadow-md">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-sky-500">
              <path d="M50 10C27.9 10 10 27.9 10 50C10 72.1 27.9 90 50 90C72.1 90 90 72.1 90 50" stroke="white" strokeWidth="2" />
              <path d="M50 85 C30.67 85 15 69.33 15 50 C15 30.67 30.67 15 50 15 C69.33 15 85 30.67 85 50 C85 58 82.3 65.4 77.7 71.2 L64 57.5 M50 70 C39 70 30 61.1 30 50 C30 38.9 38.9 30 50 30 C61.1 30 70 38.9 70 50 C70 55.5 67.8 60.5 64.1 64.1 M50 55 C47.2 55 45 52.8 45 50 C45 47.2 47.2 45 50 45" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h4 className="font-extrabold text-[13px] tracking-tight leading-none text-white flex items-center gap-1.5">
              Install Aplikasi GuruKu
              <span className="px-1.5 py-0.5 rounded-[4px] bg-sky-500/10 text-sky-400 font-black text-[8px] uppercase tracking-widest border border-sky-500/20">Instan</span>
            </h4>
            <p className="text-[10.5px] font-semibold text-slate-300 leading-tight mt-1">
              Simpan ke layar utama perangkat untuk absensi super kencang!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 hover:scale-102 active:scale-98 transition-all duration-200 bg-sky-500 text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-xl flex items-center gap-1.5 shadow-md shadow-sky-500/20"
          >
            <Download size={13} strokeWidth={2.5} />
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            aria-label="Tutup"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* iOS & generic manual PWA installer instructions overlay modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 z-[999999] overflow-hidden select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl text-white relative">
            
            {/* Miniature spiral icon */}
            <div className="w-16 h-16 bg-slate-950 rounded-2xl border border-sky-500/20 flex items-center justify-center p-2.5 shadow-lg mx-auto mb-5">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-sky-500">
                <path d="M50 10C27.9 10 10 27.9 10 50C10 72.1 27.9 90 50 90C72.1 90 90 72.1 90 50" stroke="white" strokeWidth="2" />
                <path d="M50 85 C30.67 85 15 69.33 15 50 C15 30.67 30.67 15 50 15 C69.33 15 85 30.67 85 50 C85 58 82.3 65.4 77.7 71.2 L64 57.5 M50 70 C39 70 30 61.1 30 50 C30 38.9 38.9 30 50 30 C61.1 30 70 38.9 70 50 C70 55.5 67.8 60.5 64.1 64.1 M50 55 C47.2 55 45 52.8 45 50 C45 47.2 47.2 45 50 45" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </div>

            <h3 className="text-lg font-black italic uppercase tracking-wider text-center text-white">Petunjuk Pemasangan</h3>
            <p className="text-xs text-slate-400 text-center font-bold mt-2">Dapatkan akses instan langsung dari layar utama perangkat Anda.</p>

            {/* Instruction workflow steps */}
            <div className="space-y-4 my-6 mt-6">
              <div className="flex gap-4 items-start bg-slate-950/40 p-3 rounded-2xl border border-slate-800/50">
                <div className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 flex font-extrabold text-[11px] items-center justify-center shrink-0">1</div>
                <div className="text-xs font-semibold leading-relaxed">
                  Jika menggunakan <span className="text-sky-300">iOS / Safari</span>, ketuk tombol <span className="inline-flex items-center gap-1.5 font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md"><Share size={12} className="text-sky-400" /> Bagikan (Share)</span> di bagian bawah layar.
                </div>
              </div>

              <div className="flex gap-4 items-start bg-slate-950/40 p-3 rounded-2xl border border-slate-800/50">
                <div className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 flex font-extrabold text-[11px] items-center justify-center shrink-0">2</div>
                <div className="text-xs font-semibold leading-relaxed">
                  Scroll ke bawah pada menu opsi yang muncul, lalu ketuk atau pilih perayapan menu <span className="font-bold text-white uppercase italic">"Tambahkan ke Layar Utama"</span> (Add to Home Screen).
                </div>
              </div>

              <div className="flex gap-4 items-start bg-slate-950/40 p-3 rounded-2xl border border-slate-800/50">
                <div className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 flex font-extrabold text-[11px] items-center justify-center shrink-0">3</div>
                <div className="text-xs font-semibold leading-relaxed">
                  Beri nama <span className="text-sky-300 font-bold">"Absen GuruKu"</span> lalu klik tombol <span className="font-bold text-sky-400">Tambah (Add)</span> di sudut kanan-atas perangkat. Selesai!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-98 transition-all duration-200 font-black text-xs uppercase tracking-wider text-sky-400 outline-none"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
