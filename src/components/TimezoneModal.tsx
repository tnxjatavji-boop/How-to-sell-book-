import React, { useState, useEffect } from 'react';
import { X, Search, Clock, Check, Globe } from 'lucide-react';
import { TIMEZONE_OPTIONS, TimezoneOption, formatTimeInTz, formatDateInTz } from '../utils/timezone';
import { useAppContext } from '../context/AppContext';

interface TimezoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TimezoneModal: React.FC<TimezoneModalProps> = ({ isOpen, onClose }) => {
  const { selectedTimezone, setSelectedTimezone } = useAppContext();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'asia' | 'europe' | 'americas' | 'middle_east'>('all');
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());

  // Live timer for previewing active clocks in all timezones
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const popularIds = ['utc_p5_30', 'utc_0', 'utc_p4', 'utc_p8', 'utc_m5', 'utc_p1', 'utc_p7', 'utc_p3'];

  const filteredTimezones = TIMEZONE_OPTIONS.filter(tz => {
    // Search query matching
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || 
      tz.label.toLowerCase().includes(query) ||
      tz.city.toLowerCase().includes(query) ||
      tz.country.toLowerCase().includes(query) ||
      tz.utcLabel.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Tab filter matching
    if (activeTab === 'popular') return popularIds.includes(tz.id);
    if (activeTab === 'asia') return ['utc_p5_30', 'utc_p5', 'utc_p5_45', 'utc_p6', 'utc_p6_30', 'utc_p7', 'utc_p8', 'utc_p9', 'utc_p9_30', 'utc_p10'].includes(tz.id);
    if (activeTab === 'europe') return ['utc_0', 'utc_p1', 'utc_p2', 'utc_p3'].includes(tz.id);
    if (activeTab === 'americas') return ['utc_m3', 'utc_m4', 'utc_m5', 'utc_m6', 'utc_m7', 'utc_m8', 'utc_m9', 'utc_m10'].includes(tz.id);
    if (activeTab === 'middle_east') return ['utc_p3', 'utc_p3_30', 'utc_p4', 'utc_p4_30'].includes(tz.id);

    return true;
  });

  const handleSelect = (tz: TimezoneOption) => {
    setSelectedTimezone(tz);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-blue-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0088cc] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 leading-tight">UTC Time Zone</h3>
              <p className="text-[11px] text-gray-500 font-semibold">Select your standard trading time offset</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Preview Banner */}
        <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-[#0088cc]/10 to-emerald-50 border border-blue-100 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{selectedTimezone.flag}</span>
            <div>
              <div className="text-[10px] uppercase font-bold text-[#0088cc] tracking-wider">Active Timezone</div>
              <div className="text-xs font-black text-gray-900">{selectedTimezone.utcLabel} ({selectedTimezone.city})</div>
              <div className="text-[10px] text-gray-500 font-medium">{formatDateInTz(currentTimeMs, selectedTimezone.offsetMinutes)}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-xs font-mono font-black text-[#0088cc]">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimeInTz(currentTimeMs, selectedTimezone.offsetMinutes, true)}</span>
            </div>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full mt-0.5 inline-block">
              Selected
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search UTC offset, city or country (e.g. UTC+5:30, Dubai, London)..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 mt-2.5 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { key: 'all', label: 'All Zones' },
              { key: 'popular', label: '⭐ Popular' },
              { key: 'asia', label: 'Asia / IST' },
              { key: 'middle_east', label: 'Middle East / Gulf' },
              { key: 'europe', label: 'Europe / UK' },
              { key: 'americas', label: 'Americas' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-[#0088cc] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timezone List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 px-2 py-1">
          {filteredTimezones.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs font-semibold">
              No matching UTC timezone found for "{search}".
            </div>
          ) : (
            filteredTimezones.map(tz => {
              const isSelected = selectedTimezone.id === tz.id;
              const liveClock = formatTimeInTz(currentTimeMs, tz.offsetMinutes, true);

              return (
                <button
                  key={tz.id}
                  onClick={() => handleSelect(tz)}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-50/70 border border-blue-200 text-gray-900 font-bold' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="text-2xl shrink-0 select-none">{tz.flag}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-black text-xs text-[#0088cc] bg-blue-50 px-1.5 py-0.2 rounded">
                          {tz.utcLabel}
                        </span>
                        <span className="font-extrabold text-xs text-gray-900 truncate">
                          {tz.city}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 truncate mt-0.5">
                        {tz.label}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 pl-2">
                    <div className="text-right">
                      <div className="font-mono font-black text-xs text-gray-800">
                        {liveClock}
                      </div>
                      <div className="text-[9px] text-gray-400 font-semibold">
                        Live Clock
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-[#0088cc] text-white' : 'border border-gray-300 text-transparent'
                    }`}>
                      <Check className="w-3 h-3" />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Bottom Tip Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
          <span>All trade charts, history & clocks will sync to selected UTC zone.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold cursor-pointer transition-colors shrink-0 ml-2"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
