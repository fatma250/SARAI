/**
 * Cleans up the raw responses from /api/analytics/* before charting them.
 *
 * Why this file exists: while building the redesign mockup, fetching your
 * real endpoints surfaced a few duplicate labels caused by inconsistent
 * casing / naming on the backend (not a display bug - the raw JSON itself
 * has both variants). These helpers merge them for display. Fixing the
 * source data (or normalizing on write, e.g. `.strip().title()` before
 * insert) is the real fix - this is a stopgap for the frontend.
 *
 * Confirmed duplicates as of this data pull:
 *   stakeholders-by-type : "University" (46) + "university" (2)
 *                           "Government" (4) + "government" (1)
 *   projects-by-sector   : "Health" (17) + "Healthcare" (2)
 *                           "GovTech" (11) + "Government" (3)
 *   ai-technologies      : "NLP" (14) + "Natural Language Processing" (1)
 */

/** Case-insensitive merge: sums values whose keys only differ by case. */
export function mergeCaseInsensitive(items, keyField, valueField) {
  const byLower = new Map();
  for (const item of items) {
    const lowerKey = item[keyField].trim().toLowerCase();
    if (byLower.has(lowerKey)) {
      const existing = byLower.get(lowerKey);
      existing[valueField] += item[valueField];
    } else {
      // Keep the first-seen casing as the canonical label
      byLower.set(lowerKey, { ...item });
    }
  }
  return Array.from(byLower.values());
}

/** Merge explicit label aliases, e.g. { "Healthcare": "Health" }. */
export function mergeAliases(items, keyField, valueField, aliasMap) {
  const byCanonical = new Map();
  for (const item of items) {
    const canonical = aliasMap[item[keyField]] || item[keyField];
    if (byCanonical.has(canonical)) {
      byCanonical.get(canonical)[valueField] += item[valueField];
    } else {
      byCanonical.set(canonical, { ...item, [keyField]: canonical });
    }
  }
  return Array.from(byCanonical.values());
}

/**
 * Sorts descending by value, keeps the top N, folds the rest into a single
 * "Other" bucket. Use this for donut/legend charts with more categories
 * than a legend can hold (dataviz guidance: soft cap 5-6, hard cap 7-8).
 */
export function topNWithOther(items, keyField, valueField, n, otherLabel = "Autres") {
  const sorted = [...items].sort((a, b) => b[valueField] - a[valueField]);
  const top = sorted.slice(0, n);
  const rest = sorted.slice(n);
  const otherTotal = rest.reduce((sum, item) => sum + item[valueField], 0);
  if (otherTotal > 0) {
    top.push({ [keyField]: otherLabel, [valueField]: otherTotal, isOther: true });
  }
  return top;
}

/** Convenience: cleans and buckets projects-by-sector in one call. */
export function cleanSectors(rawSectors, topN = 6, otherLabel = "Autres secteurs") {
  const merged = mergeAliases(rawSectors, "sector", "count", {
    Healthcare: "Health",
    Government: "GovTech",
  });
  return topNWithOther(merged, "sector", "count", topN, otherLabel);
}

/** Convenience: cleans and buckets stakeholders-by-type in one call. */
export function cleanOrgTypes(rawTypes, topN = 6, otherLabel = "Autres types") {
  const merged = mergeCaseInsensitive(rawTypes, "type", "count");
  return topNWithOther(merged, "type", "count", topN, otherLabel);
}

/** Convenience: cleans ai-technologies (merges NLP variants). */
export function cleanTechnologies(rawTech) {
  return mergeAliases(rawTech, "technology", "count", {
    "Natural Language Processing": "NLP",
  }).sort((a, b) => b.count - a.count);
}

/**
 * Computes the 2-3 headline "signal" sentences shown above the KPI row.
 * Pure data in, pure data out - render them however fits your i18n setup.
 * Returns null fields defensively so the caller can skip a signal if the
 * shape of the data changes later.
 */
export function computeSignals({ overview, sectors, technologies, orgTypes }) {
  const signals = [];

  if (orgTypes?.length) {
    const cleaned = cleanOrgTypes(orgTypes, 6);
    const top = cleaned[0];
    const second = cleaned[1];
    if (top && overview?.total_stakeholders) {
      const pct = Math.round((top.count / overview.total_stakeholders) * 100);
      const ratio = second ? (top.count / second.count).toFixed(1) : null;
      signals.push({
        type: "org-dominance",
        topType: top.type,
        pct,
        ratio,
        secondType: second?.type,
      });
    }
  }

  if (technologies?.length) {
    const cleaned = cleanTechnologies(technologies);
    const [first, second, third] = cleaned;
    if (first && overview?.total_projects) {
      signals.push({
        type: "tech-leader",
        name: first.technology,
        count: first.count,
        pct: Math.round((first.count / overview.total_projects) * 100),
        second,
        third,
      });
    }
  }

  if (sectors?.length && overview?.total_projects) {
    const merged = mergeAliases(sectors, "sector", "count", {
      Healthcare: "Health",
      Government: "GovTech",
    }).sort((a, b) => b.count - a.count);
    const top3 = merged.slice(0, 3);
    const top3Total = top3.reduce((s, d) => s + d.count, 0);
    signals.push({
      type: "sector-concentration",
      sectors: top3.map((d) => d.sector),
      total: top3Total,
      pct: Math.round((top3Total / overview.total_projects) * 100),
    });
  }

  return signals;
}
