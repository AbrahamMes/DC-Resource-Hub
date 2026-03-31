import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSite } from "../contexts/SiteContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/schedules", label: "Schedules" },
  { to: "/contacts", label: "Contacts" },
  { to: "/issues", label: "Issues" },
  { to: "/assets", label: "Assets" },
  { to: "/commissioning-report", label: "Commissioning" },
  { to: "/buildings", label: "Buildings" },
];

export default function Hotbar() {
  const { currentSite, availableSites, changeSite, loading } = useSite();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSiteChange(siteId) {
    changeSite(siteId);
    setDropdownOpen(false);
    navigate('/'); // Redirect to home when switching sites
  }

  const currentSiteName = availableSites.find(s => s.id === currentSite)?.name || currentSite;

  return (
    <nav style={navStyle} aria-label="Main navigation">
      {/* Site Selector */}
      <div style={siteDropdownContainer} ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={siteButton}
          disabled={loading}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          {loading ? 'Loading...' : `${currentSiteName} ▾`}
        </button>

        {dropdownOpen && (
          <div style={dropdownMenu}>
            {availableSites.map(site => (
              <button
                key={site.id}
                onClick={() => handleSiteChange(site.id)}
                style={{
                  ...dropdownItem,
                  ...(site.id === currentSite ? dropdownItemActive : {})
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(6, 150, 215, 0.1)';
                }}
                onMouseLeave={(e) => {
                  if (site.id !== currentSite) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{ fontWeight: 600 }}>{site.id}</span>
                <span style={{ fontSize: 12, color: '#888' }}>{site.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={dividerStyle} />

      {/* Navigation Links */}
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          style={({ isActive }) => (isActive ? activeLink : linkStyle)}
          onMouseEnter={(e) => {
            if (!e.target.classList.contains('active')) {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!e.target.classList.contains('active')) {
              e.target.style.backgroundColor = 'transparent';
            }
          }}
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}

const navStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  display: "flex",
  fontSize: 32,
  justifyContent: "flex-start",
  gap: 4,
  padding: "0 20px",
  borderBottom: "1px solid #333",
  background: "#1a1a1a",
  alignItems: "center",
  zIndex: 1000,
  height: 70,
  width: "100%",
  boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
};

const linkStyle = {
  color: "#a0a0a0",
  textDecoration: "none",
  padding: "8px 16px",
  borderRadius: 6,
  fontWeight: 500,
  transition: "all 0.2s ease",
  display: "inline-block",
  height: "100%",
  lineHeight: "54px"
};

const activeLink = {
  ...linkStyle,
  background: "#0696D7",
  color: "#fff",
  fontWeight: 600
};

const siteDropdownContainer = {
  position: "relative",
  marginRight: 8
};

const siteButton = {
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid #333",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  gap: 6,
  height: 40
};

const dropdownMenu = {
  position: "absolute",
  top: "calc(100% + 8px)",
  left: 0,
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: 6,
  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
  zIndex: 2000,
  minWidth: 200,
  overflow: "hidden"
};

const dropdownItem = {
  width: "100%",
  padding: "12px 16px",
  background: "transparent",
  border: "none",
  color: "#fff",
  textAlign: "left",
  cursor: "pointer",
  transition: "background 0.2s ease",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 14
};

const dropdownItemActive = {
  background: "rgba(6, 150, 215, 0.15)",
  fontWeight: 600
};

const dividerStyle = {
  width: 1,
  height: 40,
  background: "#333",
  margin: "0 8px"
};
