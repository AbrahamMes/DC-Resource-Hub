import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/schedule", label: "Schedule" },
  { to: "/contacts", label: "Contacts" },
  { to: "/issues", label: "Issues" },
  { to: "/assets", label: "Assets" },
  { to: "/commissioning-report", label: "Commis. Log" },
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
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  fontSize: 24,
  justifyContent: "center",
  gap: 12,
  padding: "10px 20px",
  borderBottom: "2px solid rgba(255, 255, 255, 0.2)",
  background: "#242424",
  alignItems: "center",
  zIndex: 1000,
  height: 56,
  width: "fit-content",
};

const linkStyle = {
  color: "#fff",
  textDecoration: "none",
  padding: "6px 15px",
  borderRadius: 4,
};

const activeLink = {
  ...linkStyle,
  background: "rgba(100,108,255,0.18)",
  color: "#fff",
};
