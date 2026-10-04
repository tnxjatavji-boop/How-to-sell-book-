import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type ToastItem = {
  id: number;
  message: string;
};

let addToast: (msg: string) => void;

export function toast(message: string) {
  if (addToast) {
    addToast(message);
  }
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    addToast = (message: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };
  }, []);

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-dark text-white px-5 py-4 rounded-[16px] text-xs font-bold shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] border-indigo-500/30 flex items-center gap-3 backdrop-blur-xl"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-400/30">
              <Info size={16} className="text-indigo-300" />
            </div>
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
