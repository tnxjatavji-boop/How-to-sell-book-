import React from 'react';
import { Newspaper, HelpCircle, BarChart2, ArrowLeftRight, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { triggerHaptic } from '../utils/haptics';

export const BottomNav = () => {
  const location = useLocation();
  const { trades, futuresPositions, tradingMode, accountType } = useAppContext();

  const activeBinaryCount = trades.filter(t => (t.accountType || 'real') === accountType && t.status === 'active').length;
  const activeFuturesCount = futuresPositions.filter(p => (p.accountType || 'real') === accountType && p.status === 'open').length;
  const activeCount = tradingMode === 'binary' ? activeBinaryCount : activeFuturesCount;

  const navItems = [
    { name: 'News', icon: Newspaper, path: '/news' },
    { name: 'Help', icon: HelpCircle, path: '/help' },
    { name: 'Trade', icon: BarChart2, path: '/' },
    { name: 'Deals', icon: ArrowLeftRight, path: '/deals', badge: activeCount },
    { name: 'Me', icon: User, path: '/me' },
  ];

  return (
    <div className="w-full bg-white/95 backdrop-blur-xl border-t border-gray-100 pb-[max(env(safe-area-inset-bottom,0px),10px)] pt-1.5 px-3 flex justify-between items-center z-50 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] relative">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <Link
            key={item.name}
            to={item.path}
            onClick={() => {
              if (!isActive) triggerHaptic('light');
            }}
            className={cn(
              "relative flex flex-col items-center justify-center w-[18%] h-12 transition-all duration-300 z-10 rounded-2xl",
              isActive ? "text-[#0088cc]" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute inset-0 bg-[#0088cc]/10 rounded-xl"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              />
            )}
            
            <motion.div
              animate={{ 
                scale: isActive ? 1.1 : 1,
                y: isActive ? -2 : 0
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="relative"
            >
              <Icon 
                className="w-5 h-5 mb-1 relative z-10" 
                strokeWidth={isActive ? 2.5 : 2} 
                fill={isActive ? 'currentColor' : 'none'}
                fillOpacity={isActive ? 0.2 : 0}
              />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#0088cc] text-white text-[9px] font-black rounded-full min-w-3.5 h-3.5 px-1 flex items-center justify-center border border-white leading-none shadow-xs z-20">
                  {item.badge}
                </span>
              )}
            </motion.div>
            <span className={cn(
              "text-[10px] tracking-wide relative z-10 transition-all duration-300",
              isActive ? "font-black opacity-100" : "font-semibold opacity-80"
            )}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
};
