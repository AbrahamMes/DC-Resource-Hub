import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSite } from "../contexts/SiteContext";
import { useAdmin } from "../contexts/AdminContext";
import "./Hotbar.css";
import { useAccess } from "../contexts/AccessContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/schedules", label: "Schedules" },
  { to: "/contacts", label: "Contacts" },
  { to: "/issues", label: "Issues" },
  { to: "/assets", label: "Assets" },
  { to: "/commissioning-report", label: "Commissioning" },
  { to: "/buildings", label: "Bluebeam / Drawings" }
];

export default function Hotbar() {
  const { currentSite, availableSites, changeSite, loading } = useSite();
  const { isAdmin, enableAdmin, disableAdmin } = useAdmin();
  const { lock } = useAccess();
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSiteChange(siteId) {
    changeSite(siteId);
    setDropdownOpen(false);
    navigate("/"); // Redirect to home when switching sites
  }

  const currentSiteName = availableSites.find((s) => s.id === currentSite)?.name || currentSite;

  return (
    <nav className="hotbar" aria-label="Main navigation">
      {/* Site Selector */}
      <div className="hotbar__site" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="hotbar__site-button"
          disabled={loading}
        >
          {loading ? "Loading..." : (
            <>
              <span className="hotbar__site-name">{currentSiteName}</span>
              <span className="hotbar__site-code">{currentSite}</span>
              <span aria-hidden="true"> ▾</span>
            </>
          )}
        </button>

        {dropdownOpen && (
          <div className="hotbar__dropdown">
            {availableSites.map((site) => (
              <button
                key={site.id}
                onClick={() => handleSiteChange(site.id)}
                className={`hotbar__dropdown-item${site.id === currentSite ? " hotbar__dropdown-item--active" : ""}`}
              >
                <span style={{ fontWeight: 600 }}>{site.id}</span>
                <span style={{ fontSize: 12, color: "#888" }}>{site.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="hotbar__divider" />

      {/* Navigation Links */}
      <div className="hotbar__links">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `hotbar__link${isActive ? " hotbar__link--active" : ""}`}
          >
            {l.label}
          </NavLink>
        ))}
      </div>

      <button
        type="button"
        className={`hotbar__admin${isAdmin ? " hotbar__admin--active" : ""}`}
        onClick={isAdmin ? disableAdmin : enableAdmin}
      >
        {isAdmin ? "Exit Admin" : "Admin"}
      </button>
      <button
        type="button"
        className="hotbar__admin"
        onClick={() => {
          if (window.confirm("Lock the website on this browser?")) lock();
        }}
      >
        Lock
      </button>
    </nav>
  );
}
