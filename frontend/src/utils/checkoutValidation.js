/**
 * checkoutValidation.js
 * Client-side validation helpers for the checkout form.
 */

// ── Pakistan location data (cities sorted A→Z within each province) ──────────
export const PAKISTAN_LOCATIONS = {
  Punjab: [
    "Bahawalpur", "Burewala", "Chiniot", "Dera Ghazi Khan", "Faisalabad",
    "Gujranwala", "Gujrat", "Hafizabad", "Jhang", "Jhelum",
    "Kasur", "Lahore", "Multan", "Okara", "Rahim Yar Khan",
    "Rawalpindi", "Sahiwal", "Sargodha", "Sheikhupura", "Sialkot",
    "Vehari", "Wah Cantt",
  ],
  Sindh: [
    "Badin", "Dadu", "Hyderabad", "Jacobabad", "Karachi",
    "Khairpur", "Kotri", "Larkana", "Mirpur Khas", "Nawabshah",
    "Sanghar", "Shikarpur", "Sukkur", "Tando Adam", "Thatta",
  ],
  KPK: [
    "Abbottabad", "Bannu", "Battagram", "Charsadda", "Chitral",
    "Dera Ismail Khan", "Hangu", "Haripur", "Kohat", "Mansehra",
    "Mardan", "Mingora", "Nowshera", "Peshawar", "Swabi",
  ],
  Balochistan: [
    "Chaman", "Dera Murad Jamali", "Gwadar", "Hub", "Kalat",
    "Kharan", "Khuzdar", "Loralai", "Mastung", "Nushki",
    "Panjgur", "Quetta", "Sibi", "Turbat", "Zhob",
  ],
  Islamabad: ["Islamabad"],
};

export const PROVINCES = Object.keys(PAKISTAN_LOCATIONS);

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

// ── Validators ────────────────────────────────────────────────────────────────

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

export const validatePhone = (phone) => {
  if (!phone?.trim()) return "Phone number is required.";
  const trimmed = phone.trim();
  if (/[^0-9\s\-+]/.test(trimmed)) return "Phone number contains invalid characters.";
  const digits = trimmed.replace(/[\s\-+]/g, "");
  const ok =
    /^03\d{9}$/.test(digits) ||
    /^92\d{10}$/.test(digits) ||
    /^3\d{9}$/.test(digits);
  return ok ? null : "Please enter a valid Pakistani phone number (e.g. 0333-8214000).";
};

export const validateName = (name) => {
  if (!name?.trim()) return "Full name is required.";
  if (name.trim().length < 2) return "Name must be at least 2 characters.";
  return null;
};

export const validateProvince = (province) => {
  if (!province) return "Please select a province.";
  if (!PROVINCES.includes(province)) return "Please select a valid province.";
  return null;
};

export const validateCity = (city) => {
  if (!city?.trim()) return "Please enter or select a city.";
  if (city.trim().length < 2) return "Please enter a valid city name.";
  if (city.trim().length > 100) return "City name is too long.";
  // Any non-empty city is accepted — manual entries are valid
  return null;
};

export const validateAddress = (address) => {
  if (!address?.trim()) return "Address is required.";
  if (address.trim().length < 5) return "Please enter a complete address.";
  return null;
};

export const validateCheckoutForm = ({ name, email, phone, province, city, address }) => {
  const errors = {
    name:     validateName(name),
    email:    validateEmail(email),
    phone:    validatePhone(phone),
    province: validateProvince(province),
    city:     validateCity(city),
    address:  validateAddress(address),
  };
  return {
    errors,
    isValid: Object.values(errors).every((e) => e === null),
  };
};
