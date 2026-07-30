/**
 * Site Context
 *
 * Provides site selection and management across the application
 */

import { createContext, useContext, useState, useEffect } from 'react';
import config from '../config';

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
  const [defaultSiteId, setDefaultSiteId] = useState(null);
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
        const defaultSite = availableSites.find(s => s.id === defaultSiteId) || availableSites[0];
        setCurrentSite(defaultSite.id);
        localStorage.setItem('selectedSite', defaultSite.id);
      }
    }
  }, [availableSites, currentSite, defaultSiteId]);

  async function loadSites() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${config.apiBaseUrl}/sites`, { credentials: 'include' });
      const data = await response.json();

      if (data.success && data.sites) {
        setAvailableSites(data.sites);
        setDefaultSiteId(data.defaultSiteId || data.sites[0]?.id || null);
      } else {
        throw new Error('Failed to load sites');
      }
    } catch (err) {
      console.error('Error loading sites:', err);
      setError(err.message);
      setAvailableSites([]);
      setCurrentSite(null);
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

  if (!loading && error) {
    return (
      <div role="alert" style={{ padding: '40px', color: '#9b1c1c', textAlign: 'center' }}>
        <h1>Site configuration unavailable</h1>
        <p>{error}</p>
        <button type="button" onClick={loadSites}>Retry</button>
      </div>
    );
  }

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
}

export default SiteContext;
