import React from "react";
import { useSite } from "../contexts/SiteContext";

export function getSavedAccProjectId(siteId, projects = [], defaultProjectId = "") {
  const savedId = localStorage.getItem(`selectedAccProject:${siteId}`);
  if (projects.some((project) => project.id === savedId)) return savedId;
  if (projects.some((project) => project.id === defaultProjectId)) return defaultProjectId;
  return projects[0]?.id || "";
}

export default function AccProjectSelector({ siteId, value, onChange }) {
  const { availableSites } = useSite();
  const projects = availableSites.find((site) => site.id === siteId)?.accProjects || [];
  if (projects.length < 2) return null;

  return (
    <label style={containerStyle}>
      <span style={labelStyle}>ACC Project</span>
      <select
        value={value}
        onChange={(event) => {
          localStorage.setItem(`selectedAccProject:${siteId}`, event.target.value);
          onChange(event.target.value);
        }}
        style={selectStyle}
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>{project.name}</option>
        ))}
      </select>
    </label>
  );
}

const containerStyle = {
  display: "grid",
  gap: "6px",
  width: "min(100%, 620px)",
  margin: "0 auto"
};
const labelStyle = {
  color: "#666",
  fontSize: "13px",
  fontWeight: 900,
  textAlign: "center",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};
const selectStyle = {
  width: "100%", padding: "13px 16px", border: "2px solid #0696D7", borderRadius: "8px",
  backgroundColor: "#fff", color: "#212529", fontSize: "20px", fontWeight: 800,
  textAlign: "center", cursor: "pointer", boxShadow: "0 2px 6px rgba(0, 0, 0, 0.12)"
};
