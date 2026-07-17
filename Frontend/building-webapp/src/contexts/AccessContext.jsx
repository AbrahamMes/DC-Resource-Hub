import { createContext, useContext, useEffect, useState } from "react";
import config from "../config";

const AccessContext = createContext(null);

export function AccessProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [expiresAt, setExpiresAt] = useState(null);

  async function checkAccess() {
    try {
      const response = await fetch(`${config.apiBaseUrl}/access/status`, {
        credentials: "include"
      });
      const data = await response.json();
      setUnlocked(Boolean(data.unlocked));
      setConfigured(data.configured !== false);
      setExpiresAt(data.expiresAt || null);
    } catch (error) {
      console.error("Failed to check website access:", error);
      setUnlocked(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkAccess();
    const timer = setInterval(checkAccess, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  async function unlock(pin) {
    const response = await fetch(`${config.apiBaseUrl}/access/unlock`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin })
    });
    const data = await response.json();

    if (!response.ok || !data.unlocked) {
      const error = new Error(data.error || "Website could not be unlocked");
      error.attemptsRemaining = data.attemptsRemaining;
      error.retryAfterSeconds = data.retryAfterSeconds;
      throw error;
    }

    setUnlocked(true);
    setConfigured(true);
    setExpiresAt(data.expiresAt || null);
  }

  async function lock() {
    try {
      await fetch(`${config.apiBaseUrl}/access/lock`, {
        method: "POST",
        credentials: "include"
      });
    } finally {
      setUnlocked(false);
      setExpiresAt(null);
    }
  }

  return (
    <AccessContext.Provider value={{ loading, unlocked, configured, expiresAt, unlock, lock }}>
      {children}
    </AccessContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAccess() {
  const context = useContext(AccessContext);
  if (!context) throw new Error("useAccess must be used inside AccessProvider");
  return context;
}

