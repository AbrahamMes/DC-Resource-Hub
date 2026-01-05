import React, { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import ImageViewer from "../components/viewer/ImageViewer";
import buildingsConfig from "../data/buildingsConfig.json";

export default function BuildingView() {
  const { id } = useParams();
  const building = buildingsConfig.buildings[id?.toLowerCase()];

  const [activeImageKey, setActiveImageKey] = useState("default");

  // If building not found, redirect to buildings list
  if (!building) {
    return <Navigate to="/buildings" replace />;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>{building.name}</h1>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginTop: 12 }}>
        <div style={{ width: "80%" }}>
          <ImageViewer imageSrc={building.images[activeImageKey]} markers={[]} />
        </div>

        <aside style={{ width: "20%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {building.views.map((view) => (
              <button
                key={view.key}
                onClick={() => setActiveImageKey(view.key)}
                style={{
                  padding: "10px 16px",
                  backgroundColor: activeImageKey === view.key ? "#0696D7" : "#1e1e1e",
                  color: "#fff",
                  border: `1px solid ${activeImageKey === view.key ? "#0696D7" : "#333"}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: activeImageKey === view.key ? 600 : 400,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (activeImageKey !== view.key) {
                    e.target.style.backgroundColor = "#252525";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeImageKey !== view.key) {
                    e.target.style.backgroundColor = "#1e1e1e";
                  }
                }}
              >
                {view.label}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
