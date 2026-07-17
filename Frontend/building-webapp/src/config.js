// Frontend configuration
// Environment variables are prefixed with VITE_ to be accessible in the browser

export const config = {
  // In development, use the same hostname that loaded the page. This supports
  // localhost on the PC and the PC's LAN address when opened from a phone.
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:3001/api`
};

export default config;
