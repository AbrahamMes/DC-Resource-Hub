import React, { useEffect, useMemo, useState } from "react";

const FALLBACK_CONTACTS = [
  { name: "Brennan Charley", company: "Prime Controls", email: "b.charley@prime-controls.com", phone: "(505) 205-4252", position: "Project Manager" },
  { name: "Abraham Mes", company: "Prime Controls", email: "a.mes@prime-controls.com", phone: "(208) 316-7271", position: "Project Engineer" },
];

function normalizeRow(row) {
  const get = (obj, candidates) => {
    const keys = Object.keys(obj || {});
    for (const cand of candidates) {
      const k = keys.find((kk) => kk.toLowerCase() === cand.toLowerCase());
      if (k) return obj[k] ?? "";
    }
    return "";
  };

  return {
    name: get(row, ["name", "full name", "contact name"]).toString(),
    company: get(row, ["company", "organization", "employer"]).toString(),
    email: get(row, ["email", "email address"]).toString(),
    phone: get(row, ["phone", "phone number", "telephone"]).toString(),
    position: get(row, ["position", "job title", "role"]).toString(),
    area: get(row, ["area", "area/equipment"]).toString(),
  };
}

export default function Contacts() {
  const [contacts, setContacts] = useState(FALLBACK_CONTACTS);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadJson() {
      try {
        const res = await fetch("/src/data/contacts.json");
        if (!res.ok) throw new Error("contacts.json not found");
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length) {
          const parsed = raw.map((r) => normalizeRow(r));
          if (!cancelled) setContacts(parsed);
        }
      } catch (e) {
        // keep fallback contacts
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadJson();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      [c.name, c.company, c.email, c.phone, c.position, c.area].join(" ").toLowerCase().includes(q)
    );
  }, [query, contacts]);

  const inputStyle = { padding: 8, fontSize: 14, width: 360, maxWidth: "100%" };
  const thStyle = { textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" };
  const tdStyle = { padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.02)" };

  return (
    <div>
      <h1>Contacts</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <label style={{ fontWeight: 600 }}>Filter:</label>
        <input
          aria-label="Filter contacts"
          placeholder="Search name, company, email, area, etc."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={inputStyle}
        />
        {loading && <span style={{ marginLeft: 8, opacity: 0.8 }}>Loading contacts…</span>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Company</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Phone Number</th>
            <th style={thStyle}>Position</th>
            <th style={thStyle}>Area/Equipment</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c, i) => (
            <tr key={i}>
              <td style={tdStyle}>{c.name}</td>
              <td style={tdStyle}>{c.company}</td>
              <td style={tdStyle}>{c.email}</td>
              <td style={tdStyle}>{c.phone}</td>
              <td style={tdStyle}>{c.position}</td>
              <td style={tdStyle}>{c.area}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && <p style={{ marginTop: 12 }}>No contacts match your filter.</p>}
    </div>
  );
}
