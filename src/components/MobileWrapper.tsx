import React from 'react';
import { motion } from 'motion/react';

interface MobileWrapperProps {
  children: React.ReactNode;
  hasPadding?: boolean;
}

export default function MobileWrapper({ children, hasPadding = true }: MobileWrapperProps) {
  return (
    <div className="h-full bg-slate-100 flex justify-center items-start lg:items-center p-0 lg:p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-full lg:max-w-[420px] lg:h-[840px] bg-white lg:rounded-[3rem] lg:shadow-2xl overflow-hidden flex flex-col relative lg:border-[8px] lg:border-slate-800"
      >
        <div className={cn(
          "flex-1 relative bg-gray-50 flex flex-col overflow-y-auto",
          hasPadding ? "pb-24" : "h-full"
        )}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// Add cn helper if not present or import it
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
