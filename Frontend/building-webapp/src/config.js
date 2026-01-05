// Frontend configuration
// Environment variables are prefixed with VITE_ to be accessible in the browser

export const config = {
  // API Base URL - defaults to localhost:3001 for development
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
};

export default config;
