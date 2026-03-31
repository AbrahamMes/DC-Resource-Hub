import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSite } from "../contexts/SiteContext";
import config from "../config";

const API_BASE_URL = config.apiBaseUrl;

export default function Buildings() {
  const { currentSite } = useSite();
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentSite) {
      fetchBuildings();
    }
  }, [currentSite]);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/sites/${currentSite}`);
      const data = await response.json();

      if (data.success && data.site) {
        setBuildings(data.site.buildings || []);
      } else {
        setError('Failed to load buildings');
      }
    } catch (err) {
      console.error('Error fetching buildings:', err);
      setError('Failed to load buildings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading buildings...</div>;
  }

  if (error) {
    return <div style={{ padding: 20, color: '#ff6b6b' }}>{error}</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Buildings - {currentSite}</h1>
      {buildings.length === 0 ? (
        <p style={{ color: '#888', marginTop: 20 }}>No buildings configured for this site yet.</p>
      ) : (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          {buildings.map((b) => (
          <Link
            key={b.id}
            to={`/buildings/${b.id}`}
            style={{
              display: "inline-block",
              padding: "10px 16px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              color: "inherit",
              textDecoration: "none",
              minWidth: 120,
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 18 }}>{b.name}</div>
            {b.description && (
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{b.description}</div>
            )}
          </Link>
        ))}
        </div>
      )}
    </div>
  );
}
