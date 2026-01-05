import React from "react";
export default function FrameSelector({ frames, activeId, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {frames.map(frame => (
        <button
          key={frame.id}
          onClick={() => onChange(frame.id)}
          style={{
            padding: "8px 12px",
            background: frame.id === activeId ? "#333" : "#eee",
            color: frame.id === activeId ? "#fff" : "#000",
            border: "none",
            cursor: "pointer"
          }}
        >
          {frame.label}
        </button>
      ))}
    </div>
  );
}
