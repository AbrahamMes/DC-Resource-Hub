import React from "react";
import { Link } from "react-router-dom";

const BUILDINGS = [
  { id: "ttx1", name: "TTX1" },
  { id: "txe10", name: "TXE10" },
  { id: "txe1", name: "TXE1" },
  { id: "txe2", name: "TXE2" },
];

export default function Buildings() {
  return (
    <div>
      <h1>Buildings</h1>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
        {BUILDINGS.map((b) => (
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
            {b.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
