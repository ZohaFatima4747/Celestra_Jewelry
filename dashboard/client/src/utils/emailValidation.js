// ── Known correct email domains for typo detection ────────────────────────────
const KNOWN_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "live.com", "icloud.com", "me.com", "protonmail.com",
  "ymail.com", "googlemail.com",
];

/** Levenshtein distance */
const levenshtein = (a, b) => {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
};

const findClosestDomain = (domain) => {
  let best = null, bestDist = Infinity;
  for (const known of KNOWN_DOMAINS) {
    const dist = levenshtein(domain, known);
    if (dist < bestDist) { bestDist = dist; best = known; }
  }
  return bestDist > 0 && bestDist <= 2 ? best : null;
};

/** Returns an error string or null. Flags invalid format and common domain typos. */
export const validateEmail = (email) => {
  if (!email?.trim()) return "Email is required.";

  const trimmed = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
    return "Please enter a valid email address.";

  const domain = trimmed.slice(trimmed.lastIndexOf("@") + 1);
  if (findClosestDomain(domain)) return "Please enter a valid email address.";

  return null;
};
