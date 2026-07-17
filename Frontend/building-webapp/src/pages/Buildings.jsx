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

      const response = await fetch(`${API_BASE_URL}/sites/${currentSite}`, { credentials: "include" });
      const data = await response.json();

      if (data.success && data.site) {
        const orderedBuildings = orderBuildings(data.site.buildings || []);
        setBuildings(orderedBuildings);
      } else {
        setError("Failed to load Bluebeam / Drawings areas");
      }
    } catch (err) {
      console.error("Error fetching Bluebeam / Drawings areas:", err);
      setError("Failed to load Bluebeam / Drawings areas");
    } finally {
      setLoading(false);
    }
  };

  function orderBuildings(buildingList) {
    const preferredOrder = [
      "txe1",
      "txe2",
      "txe3",
      "txe5",
      "txe6",
      "txe7",
      "txe10",
      "ibos",
      "admin"
    ];

    return [...buildingList].sort((a, b) => {
      const aIndex = preferredOrder.indexOf(a.id);
      const bIndex = preferredOrder.indexOf(b.id);

      if (aIndex === -1 && bIndex === -1) {
        return String(a.name || "").localeCompare(String(b.name || ""));
      }

      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }

  function openBluebeam(event, url) {
    event.preventDefault();
    event.stopPropagation();

    if (!url) {
      alert("No Bluebeam link has been added for this area yet.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return <div style={pageStyle}>Loading Bluebeam / Drawings...</div>;
  }

  if (error) {
    return <div style={{ ...pageStyle, color: "#ff6b6b" }}>{error}</div>;
  }

  return (
    <div className="page-shell buildings-page" style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Bluebeam / Drawings - {currentSite}</h1>
          <p style={subtitleStyle}>
            Open building areas, Bluebeam sessions, drawings, and markups.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchBuildings}
          style={refreshButtonStyle}
        >
          ↻ Refresh
        </button>
      </div>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Project Areas</h2>
            <p style={sectionTextStyle}>
              Select an area to view local project information or jump straight into Bluebeam.
            </p>
          </div>
        </div>

        {buildings.length === 0 ? (
          <p style={emptyTextStyle}>No project areas configured for this site yet.</p>
        ) : (
          <div className="building-grid" style={buildingGridStyle}>
            {buildings.map((building) => (
              <Link
                key={building.id}
                to={`/buildings/${building.id}`}
                style={buildingCardStyle}
              >
                <div style={buildingTopStyle}>
                  <div style={buildingIconStyle}>🏢</div>

                  <div style={bluebeamBadgeStyle}>
                    Bluebeam
                  </div>
                </div>

                <div style={buildingTextStyle}>
                  <div style={buildingNameStyle}>{building.name}</div>

                  {building.description && (
                    <div style={buildingDescriptionStyle}>{building.description}</div>
                  )}
                </div>

                <div style={buttonRowStyle}>
                  <span style={localOpenTextStyle}>Open Area →</span>

                  <button
                    type="button"
                    onClick={(event) => openBluebeam(event, building.bluebeamUrl)}
                    style={bluebeamButtonStyle}
                  >
                    Open Bluebeam →
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section style={bluebeamNoteStyle}>
        <div style={noteIconStyle}>📘</div>
        <div>
          <div style={noteTitleStyle}>Bluebeam Drawing Links</div>
          <div style={noteTextStyle}>
            Each area card opens its matching Bluebeam session in a new tab.
          </div>
        </div>
      </section>
    </div>
  );
}

const pageStyle = {
  height: "calc(100vh - 66px)",
  minHeight: 0,
  padding: 18,
  backgroundColor: "#121212",
  color: "#fff",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 6,
  flexShrink: 0
};

const titleStyle = {
  margin: 0,
  fontSize: 16,
  fontWeight: 900,
  letterSpacing: "-0.25px"
};

const subtitleStyle = {
  margin: "2px 0 0 0",
  color: "#aaa",
  fontSize: 10
};

const refreshButtonStyle = {
  padding: "5px 8px",
  borderRadius: 8,
  border: "1px solid #333",
  backgroundColor: "#1e1e1e",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 11
};

const panelStyle = {
  padding: 16,
  border: "1px solid #333",
  borderRadius: 14,
  backgroundColor: "#1e1e1e",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.28)",
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column"
};

const panelHeaderStyle = {
  display: "none",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 6,
  flexShrink: 0
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: 16,
  fontWeight: 900
};

const sectionTextStyle = {
  margin: "2px 0 0 0",
  color: "#aaa",
  fontSize: 12
};

const emptyTextStyle = {
  color: "#888",
  marginTop: 20
};

const buildingGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gridTemplateRows: "repeat(3, minmax(0, 1fr))",
  gap: 14,
  marginTop: 0,
  flex: 1,
  minHeight: 0
};

const buildingCardStyle = {
  minHeight: 0,
  padding: 14,
  background: "#121212",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  color: "inherit",
  textDecoration: "none",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: 10,
  boxShadow: "0 8px 22px rgba(0,0,0,0.24)"
};

const buildingTopStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexShrink: 0
};

const buildingIconStyle = {
  width: 32,
  height: 32,
  borderRadius: 12,
  backgroundColor: "#1e1e1e",
  border: "1px solid #333",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 17
};

const bluebeamBadgeStyle = {
  padding: "5px 9px",
  borderRadius: "999px",
  border: "1px solid rgba(143, 206, 240, 0.45)",
  backgroundColor: "rgba(6, 150, 215, 0.14)",
  color: "#8fcef0",
  fontSize: 11,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.4px"
};

const buildingTextStyle = {
  flex: "0 0 auto",
  minHeight: 0,
  flexShrink: 0
};

const buildingNameStyle = {
  fontWeight: 900,
  fontSize: 17
};

const buildingDescriptionStyle = {
  fontSize: 11,
  color: "#aaa",
  marginTop: 3,
  lineHeight: 1.25
};

const buttonRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginTop: "auto",
  flexShrink: 0
};

const localOpenTextStyle = {
  color: "#8fcef0",
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: "nowrap"
};

const bluebeamButtonStyle = {
  padding: "6px 8px",
  borderRadius: 10,
  border: "1px solid rgba(143, 206, 240, 0.55)",
  backgroundColor: "#0696D7",
  color: "#fff",
  fontSize: 11,
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
  transform: "translateY(-24px)"
};

const bluebeamNoteStyle = {
  marginTop: 8,
  padding: "7px 10px",
  borderRadius: 16,
  border: "1px solid #333",
  backgroundColor: "#1e1e1e",
  display: "none",
  alignItems: "center",
  gap: 10,
  flexShrink: 0
};

const noteIconStyle = {
  width: 30,
  height: 30,
  borderRadius: 14,
  backgroundColor: "#121212",
  border: "1px solid #333",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 17,
  flexShrink: 0
};

const noteTitleStyle = {
  fontSize: 13,
  fontWeight: 900,
  marginBottom: 1
};

const noteTextStyle = {
  color: "#aaa",
  fontSize: 11
};
