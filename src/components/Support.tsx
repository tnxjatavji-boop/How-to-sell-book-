import { useState } from "react";
import { toast } from "./Toast";
import {
  HeadphonesIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "../apiConfig";

const FAQS = [
  {
    question: "How long do withdrawals take?",
    answer:
      "Withdrawals are processed manually for security reasons. Typically, they are approved within 2-4 hours during business hours. In rare cases, it might take up to 24 hours.",
  },
  {
    question: "What is the minimum deposit amount?",
    answer:
      "The minimum deposit amount is ₹200. We accept all major UPI apps including GPay, PhonePe, and Paytm.",
  },
  {
    question: "What is the minimum withdrawal amount?",
    answer:
      "The minimum withdrawal amount is ₹500. Please ensure you have met any turnover requirements before requesting a withdrawal.",
  },
  {
    question: "How does the referral bonus work?",
    answer:
      "When someone registers using your referral code and makes their first deposit, you receive ₹20 instantly plus a 5% commission on their deposit. You also earn a 1% commission on all their bets (turnover).",
  },
  {
    question: "Why is my deposit still pending?",
    answer:
      "Please ensure you have entered the correct 12-digit UTR/Reference number from your payment app. If you have provided the correct details, please wait up to 30 minutes for it to be verified.",
  },
];

export function Support() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [loadingSupport, setLoadingSupport] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleSupportClick = () => {
    window.location.href = "/help";
  };

  return (
    <div className="w-full pb-10 space-y-6">
      <div className="glass-premium rounded-[20px] p-6 relative overflow-hidden border border-slate-800/80 bg-slate-900/40 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <h2 className="text-lg font-display font-black text-slate-100 mb-6 relative z-10 flex items-center gap-3 drop-shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-900/50 flex items-center justify-center">
            <HelpCircle size={18} className="text-indigo-400 stroke-[2.5]" />
          </div>
          Frequently Asked Questions
        </h2>

        <div className="space-y-3 relative z-10">
          {FAQS.map((faq, index) => (
            <div
              key={index}
              className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-sm"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full p-4 flex items-center justify-between text-left focus:outline-none cursor-pointer hover:bg-slate-900/40 transition-colors"
              >
                <span className="font-bold text-sm text-slate-200">
                  {faq.question}
                </span>
                <div className="flex-shrink-0 ml-2 text-indigo-400">
                  {openIndex === index ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-slate-900/60 font-medium">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-premium rounded-[20px] p-6 text-center relative overflow-hidden border border-slate-800/80 bg-slate-900/40 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        <div className="w-16 h-16 rounded-xl bg-indigo-950/80 flex items-center justify-center mx-auto mb-4 border border-indigo-900/50 shadow-inner">
          <HeadphonesIcon size={24} className="text-indigo-400 stroke-[2.5]" />
        </div>
        <h3 className="font-display font-black text-slate-100 text-lg mb-2">
          Still need help?
        </h3>
        <p className="text-xs text-slate-400 mb-6 px-4">
          If your issue isn't resolved in the FAQs, our live support team is
          available to assist you.
        </p>

        <button
          onClick={handleSupportClick}
          disabled={loadingSupport}
          className="w-full py-4 rounded-xl border-none bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold cursor-pointer active:scale-[0.99] transition-all shadow-[0_4px_20px_rgba(99,102,241,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loadingSupport ? (
            "Connecting..."
          ) : (
            <>
              Contact Live Support <ExternalLink size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
