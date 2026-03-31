/**
 * Site Context
 *
 * Provides site selection and management across the application
 */

import { createContext, useContext, useState, useEffect } from 'react';

const SiteContext = createContext();

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
}

export function SiteProvider({ children }) {
  const [currentSite, setCurrentSite] = useState(null);
  const [availableSites, setAvailableSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load available sites from API on mount
  useEffect(() => {
    loadSites();
  }, []);

  // Load currentSite from localStorage after sites are loaded
  useEffect(() => {
    if (availableSites.length > 0 && !currentSite) {
      const savedSite = localStorage.getItem('selectedSite');
      if (savedSite && availableSites.find(s => s.id === savedSite)) {
        setCurrentSite(savedSite);
      } else {
        // Default to first site
        setCurrentSite(availableSites[0].id);
      }
    }
  }, [availableSites, currentSite]);

  async function loadSites() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:3001/api/sites');
      const data = await response.json();

      if (data.success && data.sites) {
        setAvailableSites(data.sites);
      } else {
        throw new Error('Failed to load sites');
      }
    } catch (err) {
      console.error('Error loading sites:', err);
      setError(err.message);
      // Fallback to default site
      setAvailableSites([{ id: 'TTX', name: 'Temple, TX', fullName: 'Temple Data Center' }]);
      setCurrentSite('TTX');
    } finally {
      setLoading(false);
    }
  }

  function changeSite(siteId) {
    if (!siteId) return;

    // Validate site exists
    const site = availableSites.find(s => s.id === siteId);
    if (!site) {
      console.error(`Site ${siteId} not found`);
      return;
    }

    // Update state
    setCurrentSite(siteId);

    // Save to localStorage
    localStorage.setItem('selectedSite', siteId);

    console.log(`✅ Switched to site: ${siteId} (${site.name})`);
  }

  const value = {
    currentSite,
    availableSites,
    loading,
    error,
    changeSite,
    reloadSites: loadSites
  };

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
}

export default SiteContext;
