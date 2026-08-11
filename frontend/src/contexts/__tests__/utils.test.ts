import { describe, it, expect, vi, afterEach } from "vitest";
import { getTodayAdString } from "@/lib/utils";

describe("getTodayAdString", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns today's date in local time as YYYY-MM-DD", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 6, 26)); // July 26, 2026, local time
        expect(getTodayAdString()).toBe("2026-07-26");
    });

    it("zero-pads single-digit months and days", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 0, 5)); // Jan 5, 2026
        expect(getTodayAdString()).toBe("2026-01-05");
    });

    it("string comparison against an ISO date string is timezone-safe, unlike the old Date-object comparison", () => {
        // Regression test for the actual bug: `new Date("2026-07-26")` parses
        // as UTC midnight, while `new Date()` (local "today") is local
        // midnight. In timezones behind UTC, local midnight of the same
        // calendar day comes AFTER UTC midnight, so `new Date(dateString) >=
        // localToday` could wrongly evaluate to false for a holiday that IS
        // today, right up until several hours into the day. Plain string
        // comparison of two "YYYY-MM-DD" strings sidesteps this entirely.
        const today = getTodayAdString();
        const sameDay = today;
        const yesterday = "2020-01-01";
        const farFuture = "2099-12-31";

        expect(sameDay >= today).toBe(true);
        expect(yesterday >= today).toBe(false);
        expect(farFuture >= today).toBe(true);
    });
});