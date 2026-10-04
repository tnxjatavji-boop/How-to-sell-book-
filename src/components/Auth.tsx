import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Gem,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "./Toast";
import { getApiUrl } from "../apiConfig";

export function Auth({ onLogin }: { onLogin: (userId: string) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [referralCode, setReferralCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("ref") || "";
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      toast("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isLogin ? "/api/login" : "/api/register";
      const res = await fetch(getApiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, referralCode }),
      });
      const data = await res.json();

      if (data.success) {
        toast(
          isLogin
            ? "Authentication Successful"
            : "Account Initiated (Bonus ₹97 Credited)",
        );
        setTimeout(() => onLogin(data.userId), 500);
      } else {
        toast(data.message || "Authentication Failed");
      }
    } catch (e) {
      toast("Network error. Try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md relative z-10 px-5">
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center mb-10"
      >
        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 rounded-[24px] flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] mb-6 border border-indigo-500/20 relative">
          <div className="absolute inset-0 bg-white/10 rounded-[24px] blur-sm opacity-50" />
          <Gem size={46} className="text-white relative z-10 animate-pulse" />
        </div>
        <h1 className="font-display text-5xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400 uppercase pb-1 text-center drop-shadow-sm">
          Pingo
        </h1>
        <p className="text-indigo-400/90 text-[10px] mt-2.5 font-extrabold tracking-[0.25em] uppercase flex items-center gap-2">
          <ShieldCheck size={11} className="text-indigo-400" /> Premium Mining Protocol
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        className="glass-premium rounded-[20px] p-8 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-slate-800/80 bg-slate-900/40"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl"></div>
        
        <div className="flex mb-8 relative z-10 p-1 bg-slate-950/80 border border-slate-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 text-xs font-black transition-all duration-300 uppercase tracking-widest relative rounded-lg ${isLogin ? "text-white" : "text-slate-500 hover:text-slate-300 cursor-pointer"}`}
          >
            Sign In
            {isLogin && (
              <motion.div
                layoutId="auth-tab"
                className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md rounded-lg -z-10"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 text-xs font-black transition-all duration-300 uppercase tracking-widest relative rounded-lg ${!isLogin ? "text-white" : "text-slate-500 hover:text-slate-300 cursor-pointer"}`}
          >
            Register
            {!isLogin && (
              <motion.div
                layoutId="auth-tab"
                className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md rounded-lg -z-10"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-4"
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon size={18} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="username"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 py-3.5 pl-11 pr-4 rounded-[12px] outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-500 font-medium text-sm shadow-inner"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Gem size={18} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Referral Code (Optional)"
                    value={referralCode}
                    onChange={(e) =>
                      setReferralCode(e.target.value.toUpperCase())
                    }
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 py-3.5 pl-11 pr-4 rounded-[12px] outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-500 font-medium text-sm shadow-inner"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail size={18} className="text-slate-500" />
            </div>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 py-3.5 pl-11 pr-4 rounded-[12px] outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-500 font-medium text-sm shadow-inner"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={18} className="text-slate-500" />
            </div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 py-3.5 pl-11 pr-4 rounded-[12px] outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-500 font-medium text-sm shadow-inner"
            />
          </div>

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-indigo-400 font-bold transition-colors cursor-pointer"
              >
                Recover Access
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-4 rounded-[12px] border-none bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:from-indigo-600 hover:to-purple-700 active:scale-[0.99] transition-all uppercase tracking-widest cursor-pointer disabled:opacity-50 shadow-[0_4px_20px_rgba(99,102,241,0.2)]"
          >
            {isLoading
              ? "Processing..."
              : isLogin
                ? "Authenticate"
                : "Initialize Account"}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
