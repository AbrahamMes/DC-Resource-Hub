import React from "react";
import { NavLink } from "react-router-dom";

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
  return (
    <nav style={navStyle} aria-label="Main navigation">
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
