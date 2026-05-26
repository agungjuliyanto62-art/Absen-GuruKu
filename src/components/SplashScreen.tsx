import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }: { onComplete: () => void, key?: string }) {
  const [dots, setDots] = useState<{ x: number, y: number }[]>([]);

  useEffect(() => {
    // Generate some random positions for the dots pattern
    const newDots = Array.from({ length: 48 }).map((_, i) => ({
      x: (i % 6) * 15,
      y: Math.floor(i / 6) * 15
    }));
    setDots(newDots);

    // Complete after 400ms for immediate access
    const timer = setTimeout(() => {
      onComplete();
    }, 400);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Patterns */}
      <div className="absolute top-0 right-0 p-8 opacity-20">
        <div className="grid grid-cols-6 gap-3">
          {dots.map((dot, i) => (
            <div key={`dot-tr-${i}`} className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          ))}
        </div>
      </div>

      <div className="absolute bottom-20 left-10 p-8 opacity-20">
        <div className="grid grid-cols-4 gap-3">
          {dots.slice(0, 24).map((dot, i) => (
            <div key={`dot-bl-${i}`} className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          ))}
        </div>
      </div>

      {/* Squiggles and Triangles (Simplified SVG) */}
      <svg className="absolute top-1/4 right-10 text-sky-200 w-24 h-24 opacity-40" viewBox="0 0 100 100">
        <path d="M10,50 Q25,30 40,50 T70,50 T100,50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      
      <svg className="absolute top-1/3 right-4 text-sky-200 w-12 h-12 opacity-30" viewBox="0 0 100 100">
        <path d="M20,80 L50,20 L80,80 Z" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>

      <svg className="absolute bottom-1/4 left-0 text-sky-100 w-full h-auto opacity-40" viewBox="0 0 400 400">
        <path d="M100,400 L200,250 L300,400 M150,400 L250,280 L350,400" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Content */}
      <div className="flex flex-col items-center relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-32 h-32 mb-6"
        >
          {/* Custom SVG Spiral Logo */}
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-sky-500">
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

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex flex-row items-baseline gap-3 relative group overflow-hidden px-10 py-3"
        >
          <h1 className="text-4xl font-black text-slate-800 tracking-[-0.05em] uppercase italic relative z-10">
            Absen
          </h1>
          <span className="text-xl font-black text-primary tracking-tight italic relative z-10 uppercase">
            GuruKu
          </span>
          
          {/* Light Streak / Shimmer Effect */}
          <motion.div 
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ 
              x: ['-100%', '100%'],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 2.5,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut",
              times: [0, 0.5, 1]
            }}
          >
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-20" />
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative dot grid bottom right */}
      <div className="absolute bottom-10 right-10 p-4 opacity-10">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={`dot-br-${i}`} className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
