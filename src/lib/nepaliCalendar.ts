import NepaliDate from "nepali-date-converter";

// Nepali month names
export const NEPALI_MONTHS = [
  "बैशाख", "जेठ", "असार", "श्रावण", "भाद्र", "असोज",
  "कार्तिक", "मंसिर", "पुष", "माघ", "फाल्गुण", "चैत्र"
];

export const NEPALI_MONTHS_EN = [
  "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

export const NEPALI_DAYS = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"];
export const NEPALI_DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Days in each Nepali month for different years (2080-2090)
const BS_CALENDAR_DATA: Record<number, number[]> = {
  2080: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2081: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2083: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2084: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2085: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2086: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2087: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2088: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2089: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2090: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
};

export const getDaysInMonth = (year: number, month: number): number => {
  const yearData = BS_CALENDAR_DATA[year];
  if (yearData && month >= 1 && month <= 12) {
    return yearData[month - 1];
  }
  return 30; // Default fallback
};

export const getTodayBS = (): { year: number; month: number; day: number } => {
  try {
    const nepaliDate = new NepaliDate();
    return {
      year: nepaliDate.getYear(),
      month: nepaliDate.getMonth() + 1,
      day: nepaliDate.getDate(),
    };
  } catch {
    return { year: 2081, month: 1, day: 1 };
  }
};

export const convertBStoAD = (year: number, month: number, day: number): Date | null => {
  try {
    const nepaliDate = new NepaliDate(year, month - 1, day);
    return nepaliDate.toJsDate();
  } catch {
    return null;
  }
};

export const convertADtoBS = (date: Date): { year: number; month: number; day: number } | null => {
  try {
    const nepaliDate = new NepaliDate(date);
    return {
      year: nepaliDate.getYear(),
      month: nepaliDate.getMonth() + 1,
      day: nepaliDate.getDate(),
    };
  } catch {
    return null;
  }
};

export const formatBSDate = (year: number, month: number, day: number, useNepali = false): string => {
  const monthName = useNepali ? NEPALI_MONTHS[month - 1] : NEPALI_MONTHS_EN[month - 1];
  return `${day} ${monthName} ${year}`;
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  const adDate = convertBStoAD(year, month, 1);
  if (adDate) {
    return adDate.getDay();
  }
  return 0;
};

export const isToday = (year: number, month: number, day: number): boolean => {
  const today = getTodayBS();
  return today.year === year && today.month === month && today.day === day;
};

export const isPastDate = (year: number, month: number, day: number): boolean => {
  const today = getTodayBS();
  if (year < today.year) return true;
  if (year === today.year && month < today.month) return true;
  if (year === today.year && month === today.month && day < today.day) return true;
  return false;
};
