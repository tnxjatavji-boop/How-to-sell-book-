export interface TimezoneOption {
  id: string;
  label: string;
  offsetMinutes: number;
  utcLabel: string;
  city: string;
  country: string;
  flag: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { id: 'utc_0', label: 'UTC (GMT) - London, Dublin, Lisbon', offsetMinutes: 0, utcLabel: 'UTC+0:00', city: 'London', country: 'United Kingdom', flag: '🇬🇧' },
  { id: 'utc_p1', label: 'UTC+1 - Berlin, Paris, Rome, Madrid, Lagos', offsetMinutes: 60, utcLabel: 'UTC+1:00', city: 'Paris / Berlin', country: 'Europe', flag: '🇪🇺' },
  { id: 'utc_p2', label: 'UTC+2 - Cairo, Athens, Johannesburg, Kyiv', offsetMinutes: 120, utcLabel: 'UTC+2:00', city: 'Cairo', country: 'Egypt', flag: '🇪🇬' },
  { id: 'utc_p3', label: 'UTC+3 - Moscow, Istanbul, Riyadh, Nairobi', offsetMinutes: 180, utcLabel: 'UTC+3:00', city: 'Riyadh / Moscow', country: 'Saudi Arabia', flag: '🇸🇦' },
  { id: 'utc_p3_30', label: 'UTC+3:30 - Tehran', offsetMinutes: 210, utcLabel: 'UTC+3:30', city: 'Tehran', country: 'Iran', flag: '🇮🇷' },
  { id: 'utc_p4', label: 'UTC+4 - Dubai, Abu Dhabi, Baku, Muscat', offsetMinutes: 240, utcLabel: 'UTC+4:00', city: 'Dubai', country: 'UAE', flag: '🇦🇪' },
  { id: 'utc_p4_30', label: 'UTC+4:30 - Kabul', offsetMinutes: 270, utcLabel: 'UTC+4:30', city: 'Kabul', country: 'Afghanistan', flag: '🇦🇫' },
  { id: 'utc_p5', label: 'UTC+5 - Karachi, Tashkent, Islamabad', offsetMinutes: 300, utcLabel: 'UTC+5:00', city: 'Karachi', country: 'Pakistan', flag: '🇵🇰' },
  { id: 'utc_p5_30', label: 'UTC+5:30 (IST) - New Delhi, Mumbai, Kolkata', offsetMinutes: 330, utcLabel: 'UTC+5:30', city: 'New Delhi', country: 'India', flag: '🇮🇳' },
  { id: 'utc_p5_45', label: 'UTC+5:45 - Kathmandu', offsetMinutes: 345, utcLabel: 'UTC+5:45', city: 'Kathmandu', country: 'Nepal', flag: '🇳🇵' },
  { id: 'utc_p6', label: 'UTC+6 - Dhaka, Almaty, Astana', offsetMinutes: 360, utcLabel: 'UTC+6:00', city: 'Dhaka', country: 'Bangladesh', flag: '🇧🇩' },
  { id: 'utc_p6_30', label: 'UTC+6:30 - Yangon', offsetMinutes: 390, utcLabel: 'UTC+6:30', city: 'Yangon', country: 'Myanmar', flag: '🇲🇲' },
  { id: 'utc_p7', label: 'UTC+7 - Bangkok, Jakarta, Hanoi, Ho Chi Minh', offsetMinutes: 420, utcLabel: 'UTC+7:00', city: 'Bangkok / Jakarta', country: 'SE Asia', flag: '🇻🇳' },
  { id: 'utc_p8', label: 'UTC+8 - Singapore, Hong Kong, Beijing, Manila', offsetMinutes: 480, utcLabel: 'UTC+8:00', city: 'Singapore / HK', country: 'Singapore', flag: '🇸🇬' },
  { id: 'utc_p9', label: 'UTC+9 - Tokyo, Seoul', offsetMinutes: 540, utcLabel: 'UTC+9:00', city: 'Tokyo / Seoul', country: 'Japan', flag: '🇯🇵' },
  { id: 'utc_p9_30', label: 'UTC+9:30 - Adelaide, Darwin', offsetMinutes: 570, utcLabel: 'UTC+9:30', city: 'Adelaide', country: 'Australia', flag: '🇦🇺' },
  { id: 'utc_p10', label: 'UTC+10 - Sydney, Melbourne, Brisbane', offsetMinutes: 600, utcLabel: 'UTC+10:00', city: 'Sydney', country: 'Australia', flag: '🇦🇺' },
  { id: 'utc_p11', label: 'UTC+11 - Solomon Islands, Noumea', offsetMinutes: 660, utcLabel: 'UTC+11:00', city: 'Solomon Is.', country: 'Pacific', flag: '🇸🇧' },
  { id: 'utc_p12', label: 'UTC+12 - Auckland, Wellington, Fiji', offsetMinutes: 720, utcLabel: 'UTC+12:00', city: 'Auckland', country: 'New Zealand', flag: '🇳🇿' },
  { id: 'utc_m1', label: 'UTC-1 - Cape Verde, Azores', offsetMinutes: -60, utcLabel: 'UTC-1:00', city: 'Cape Verde', country: 'Atlantic', flag: '🇨🇻' },
  { id: 'utc_m2', label: 'UTC-2 - Fernando de Noronha', offsetMinutes: -120, utcLabel: 'UTC-2:00', city: 'Mid-Atlantic', country: 'Brazil', flag: '🇧🇷' },
  { id: 'utc_m3', label: 'UTC-3 - São Paulo, Buenos Aires, Rio', offsetMinutes: -180, utcLabel: 'UTC-3:00', city: 'São Paulo', country: 'Brazil', flag: '🇧🇷' },
  { id: 'utc_m3_30', label: 'UTC-3:30 - St. John\'s (Newfoundland)', offsetMinutes: -210, utcLabel: 'UTC-3:30', city: 'St. John\'s', country: 'Canada', flag: '🇨🇦' },
  { id: 'utc_m4', label: 'UTC-4 - New York (EDT), Santiago, Caracas', offsetMinutes: -240, utcLabel: 'UTC-4:00', city: 'Santiago / Caracas', country: 'Americas', flag: '🇨🇱' },
  { id: 'utc_m5', label: 'UTC-5 - New York (EST), Toronto, Bogota, Lima', offsetMinutes: -300, utcLabel: 'UTC-5:00', city: 'New York / Bogota', country: 'USA', flag: '🇺🇸' },
  { id: 'utc_m6', label: 'UTC-6 - Chicago, Mexico City, Dallas', offsetMinutes: -360, utcLabel: 'UTC-6:00', city: 'Chicago / CDMX', country: 'USA / Mexico', flag: '🇲🇽' },
  { id: 'utc_m7', label: 'UTC-7 - Denver, Phoenix, Calgary', offsetMinutes: -420, utcLabel: 'UTC-7:00', city: 'Denver / Phoenix', country: 'USA', flag: '🇺🇸' },
  { id: 'utc_m8', label: 'UTC-8 - Los Angeles, San Francisco, Vancouver', offsetMinutes: -480, utcLabel: 'UTC-8:00', city: 'Los Angeles', country: 'USA', flag: '🇺🇸' },
  { id: 'utc_m9', label: 'UTC-9 - Anchorage', offsetMinutes: -540, utcLabel: 'UTC-9:00', city: 'Anchorage', country: 'Alaska', flag: '🇺🇸' },
  { id: 'utc_m10', label: 'UTC-10 - Honolulu (Hawaii)', offsetMinutes: -600, utcLabel: 'UTC-10:00', city: 'Honolulu', country: 'Hawaii', flag: '🇺🇸' },
  { id: 'utc_m11', label: 'UTC-11 - Pago Pago, Samoa', offsetMinutes: -660, utcLabel: 'UTC-11:00', city: 'Pago Pago', country: 'Samoa', flag: '🇼🇸' },
  { id: 'utc_m12', label: 'UTC-12 - Baker Island, AoE', offsetMinutes: -720, utcLabel: 'UTC-12:00', city: 'Anywhere on Earth', country: 'International', flag: '🌐' },
];

export const DEFAULT_TIMEZONE: TimezoneOption = TIMEZONE_OPTIONS.find(t => t.id === 'utc_p5_30') || TIMEZONE_OPTIONS[0];

/**
 * Format timestamp (ms) into formatted time string (HH:MM:SS) for a specific UTC offset (in minutes).
 */
export function formatTimeInTz(timestamp: number | Date, offsetMinutes: number, includeSeconds = true): string {
  const timeMs = typeof timestamp === 'number' ? timestamp : timestamp.getTime();
  // Target UTC shifted time
  const targetDate = new Date(timeMs + offsetMinutes * 60 * 1000);
  const hours = targetDate.getUTCHours().toString().padStart(2, '0');
  const minutes = targetDate.getUTCMinutes().toString().padStart(2, '0');
  if (!includeSeconds) {
    return `${hours}:${minutes}`;
  }
  const seconds = targetDate.getUTCSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Format timestamp (ms) into formatted full date/time string (DD MMM, HH:MM:SS) for a specific UTC offset.
 */
export function formatDateTimeInTz(timestamp: number | Date, offsetMinutes: number, includeSeconds = true): string {
  const timeMs = typeof timestamp === 'number' ? timestamp : timestamp.getTime();
  const targetDate = new Date(timeMs + offsetMinutes * 60 * 1000);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = targetDate.getUTCDate().toString().padStart(2, '0');
  const month = months[targetDate.getUTCMonth()];
  const hours = targetDate.getUTCHours().toString().padStart(2, '0');
  const minutes = targetDate.getUTCMinutes().toString().padStart(2, '0');
  
  if (!includeSeconds) {
    return `${day} ${month}, ${hours}:${minutes}`;
  }
  const seconds = targetDate.getUTCSeconds().toString().padStart(2, '0');
  return `${day} ${month}, ${hours}:${minutes}:${seconds}`;
}

/**
 * Format timestamp into Date only (DD MMM YYYY)
 */
export function formatDateInTz(timestamp: number | Date, offsetMinutes: number): string {
  const timeMs = typeof timestamp === 'number' ? timestamp : timestamp.getTime();
  const targetDate = new Date(timeMs + offsetMinutes * 60 * 1000);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = targetDate.getUTCDate().toString().padStart(2, '0');
  const month = months[targetDate.getUTCMonth()];
  const year = targetDate.getUTCFullYear();
  return `${day} ${month} ${year}`;
}
