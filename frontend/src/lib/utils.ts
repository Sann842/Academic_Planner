import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Today's date as a local "YYYY-MM-DD" string.
 *
 * Use this (with plain string comparison) instead of comparing Date
 * objects against an AD date string like `new Date(dateString) >= today`.
 * ISO date-only strings ("YYYY-MM-DD") are parsed by `new Date()` as UTC
 * midnight, while a locally-constructed `Date` is local midnight - these
 * disagree by several hours depending on the browser's timezone, which can
 * silently shift which day is considered "today" for anyone not in a
 * timezone with a positive UTC offset. Zero-padded ISO date strings sort
 * correctly with plain string comparison, sidestepping the whole issue.
 */
export function getTodayAdString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}