export const CENTER_HEALTH_REMINDER_STORAGE_PREFIX = "edunudg.centerHealthReminder";

function memoryStorage(): Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length"> {
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
  };
}

function resolveStorage(storage?: Storage): Storage {
  if (storage) return storage;
  if (typeof window !== "undefined" && window.sessionStorage) return window.sessionStorage;
  return memoryStorage() as Storage;
}

export function centerHealthReminderStorageKey(brandId: string, userId: string): string {
  return `${CENTER_HEALTH_REMINDER_STORAGE_PREFIX}:${brandId}:${userId}`;
}

export function shouldShowCenterHealthReminder(input: {
  percent: number;
  brandId: string;
  userId: string;
  storage?: Storage;
}): boolean {
  if (input.percent >= 100 || !input.brandId || !input.userId) return false;
  return resolveStorage(input.storage).getItem(centerHealthReminderStorageKey(input.brandId, input.userId)) !== "1";
}

export function markCenterHealthReminderSeen(brandId: string, userId: string, storage?: Storage): void {
  if (!brandId || !userId) return;
  resolveStorage(storage).setItem(centerHealthReminderStorageKey(brandId, userId), "1");
}

export function clearCenterHealthReminders(storage?: Storage): void {
  const store = resolveStorage(storage);
  const keys: string[] = [];
  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index);
    if (key?.startsWith(`${CENTER_HEALTH_REMINDER_STORAGE_PREFIX}:`)) keys.push(key);
  }
  for (const key of keys) store.removeItem(key);
}
