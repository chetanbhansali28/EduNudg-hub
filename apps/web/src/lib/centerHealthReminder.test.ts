import { describe, expect, it } from "vitest";
import {
  CENTER_HEALTH_REMINDER_STORAGE_PREFIX,
  clearCenterHealthReminders,
  markCenterHealthReminderSeen,
  shouldShowCenterHealthReminder,
} from "./centerHealthReminder";

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    removeItem(key: string) {
      data.delete(key);
    },
    clear() {
      data.clear();
    },
  };
}

describe("centerHealthReminder", () => {
  it("regression_skips_center_health_popup_when_setup_is_complete", () => {
    const storage = memoryStorage();
    expect(
      shouldShowCenterHealthReminder({ percent: 100, brandId: "brand-1", userId: "user-1", storage })
    ).toBe(false);
  });

  it("regression_shows_center_health_popup_once_per_login_until_seen", () => {
    const storage = memoryStorage();
    expect(
      shouldShowCenterHealthReminder({ percent: 50, brandId: "brand-1", userId: "user-1", storage })
    ).toBe(true);
    markCenterHealthReminderSeen("brand-1", "user-1", storage);
    expect(
      shouldShowCenterHealthReminder({ percent: 50, brandId: "brand-1", userId: "user-1", storage })
    ).toBe(false);
    expect(storage.getItem(`${CENTER_HEALTH_REMINDER_STORAGE_PREFIX}:brand-1:user-1`)).toBe("1");
  });

  it("regression_clears_center_health_popup_seen_flag_on_logout", () => {
    const storage = memoryStorage();
    markCenterHealthReminderSeen("brand-1", "user-1", storage);
    clearCenterHealthReminders(storage);
    expect(
      shouldShowCenterHealthReminder({ percent: 25, brandId: "brand-1", userId: "user-1", storage })
    ).toBe(true);
  });
});
