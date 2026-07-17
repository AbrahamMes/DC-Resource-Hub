import React from "react";

const ACC_PROJECTS = {
  TXE: [
    { id: "fe0c7a6d-1115-42d7-897e-206f80b63edb", name: "Hensel Phelps" },
    { id: "a0482399-f629-4aeb-9245-4da64cc2ac1c", name: "JE Dunn" }
  ],
  TTX: [
    { id: "b38e25ea-eca5-4a70-9f0b-85eeb399056f", name: "Temple Data Center" }
  ]
};

export function getAccProjects(siteId) {
  return ACC_PROJECTS[String(siteId || "").toUpperCase()] || [];
}

export function getSavedAccProjectId(siteId) {
  const projects = getAccProjects(siteId);
  const savedId = localStorage.getItem(`selectedAccProject:${siteId}`);
  return projects.some((project) => project.id === savedId) ? savedId : projects[0]?.id || "";
}

export default function AccProjectSelector({ siteId, value, onChange }) {
  const projects = getAccProjects(siteId);
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
