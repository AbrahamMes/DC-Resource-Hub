import React, { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useSite } from "../contexts/SiteContext";
import config from "../config";

const API_BASE_URL = config.apiBaseUrl;

export default function BuildingView() {
  const { id } = useParams();
  const { currentSite } = useSite();
  const [building, setBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentSite && id) {
      fetchBuilding();
    }
  }, [currentSite, id]);

  const fetchBuilding = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/sites/${currentSite}/buildings/${id}`, { credentials: "include" });
      const data = await response.json();

      if (data.success && data.building) {
        setBuilding(data.building);
      } else {
        setError('Building not found');
      }
    } catch (err) {
      console.error('Error fetching building:', err);
      setError('Failed to load building');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading building...</div>;
  }

  if (error || !building) {
    return <Navigate to="/buildings" replace />;
  }

  return (
    <div className="page-shell" style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <Link to="/buildings" style={{ color: '#0696D7', textDecoration: 'none' }}>
          ← Back to Buildings
        </Link>
      </div>

      <h1>{building.name}</h1>
      {building.description && (
        <p style={{ color: '#888', marginTop: 8 }}>{building.description}</p>
      )}

      <h2 style={{ marginTop: 30, marginBottom: 16, fontSize: 24 }}>Rooms & Areas</h2>

      {building.rooms && building.rooms.length > 0 ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {building.rooms.map((room) => (
            <Link
              key={room.id}
              to={`/buildings/${id}/rooms/${room.id}`}
              style={{
                display: "block",
                padding: "16px 20px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6,
                color: "inherit",
                textDecoration: "none",
                minWidth: 150,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#0696D7";
                e.currentTarget.style.backgroundColor = "rgba(6, 150, 215, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 16 }}>{room.name}</div>
              {room.fullName && (
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{room.fullName}</div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p style={{ color: '#888' }}>No rooms configured for this building yet.</p>
      )}
    </div>
  );
}
