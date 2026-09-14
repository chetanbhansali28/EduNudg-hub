const storageKey = (brandSlug: string) => `edunudg.learnLoginCenter:${brandSlug}`;

export function centerSlugFromFranchiseReferrer(referrer: string, brandSlug: string): string | null {
  const brand = brandSlug.trim().toLowerCase();
  if (!referrer.trim() || !brand) return null;
  let host = "";
  try {
    host = new URL(referrer).hostname.toLowerCase().split(":")[0];
  } catch {
    return null;
  }
  if (!host.endsWith(".localhost")) {
    const segs = host.split(".").filter(Boolean);
    if (segs.length >= 3 && segs.includes(brand)) {
      const center = segs[0];
      if (center && center !== "learn" && center !== "parents" && center !== brand) return center;
    }
    return null;
  }
  const without = host.slice(0, -".localhost".length);
  const segs = without.split(".").filter(Boolean);
  if (segs.length >= 2 && segs[segs.length - 1] === brand) {
    const center = segs[0];
    if (center && center !== "learn" && center !== "parents") return center;
  }
  return null;
}

export function readStoredLearnLoginCenter(brandSlug: string): string | null {
  const brand = brandSlug.trim().toLowerCase();
  if (!brand || typeof sessionStorage === "undefined") return null;
  try {
    return sessionStorage.getItem(storageKey(brand))?.trim().toLowerCase() || null;
  } catch {
    return null;
  }
}

export function storeLearnLoginCenter(brandSlug: string, centerSlug: string): void {
  const brand = brandSlug.trim().toLowerCase();
  const center = centerSlug.trim().toLowerCase();
  if (!brand || !center || typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(brand), center);
  } catch {
    /* ignore quota / private mode */
  }
}

export function resolveLearnLoginCenterSlug(input: {
  brandSlug: string;
  queryCenter?: string | null;
  referrer?: string;
}): string | null {
  const brandSlug = input.brandSlug.trim().toLowerCase();
  const fromQuery = input.queryCenter?.trim().toLowerCase() || null;
  if (fromQuery && fromQuery !== "learn" && fromQuery !== "parents") {
    storeLearnLoginCenter(brandSlug, fromQuery);
    return fromQuery;
  }
  const fromReferrer = centerSlugFromFranchiseReferrer(input.referrer ?? "", brandSlug);
  if (fromReferrer) {
    storeLearnLoginCenter(brandSlug, fromReferrer);
    return fromReferrer;
  }
  return readStoredLearnLoginCenter(brandSlug);
}
