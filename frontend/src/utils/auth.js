/**
 * Decode the JWT stored in localStorage and return the user's ID.
 * Returns null if no token exists or decoding fails.
 */
export const getUserId = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1])).id;
  } catch {
    return null;
  }
};

/**
 * Decode the JWT and return the user's email.
 */
export const getUserEmail = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1])).email || null;
  } catch {
    return null;
  }
};

/**
 * Decode the JWT and return the user's role.
 */
export const getUserRole = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1])).role || null;
  } catch {
    return null;
  }
};
