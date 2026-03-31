import { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export default function ImageViewer({ imageSrc, markers, onMarkerClick }) {
  const [hoveredMarker, setHoveredMarker] = useState(null);

  return (
    <TransformWrapper initialScale={1} minScale={0.5} maxScale={3}>
      <TransformComponent>
        <div style={{ position: "relative" }}>
          <img src={imageSrc} style={{ width: "100%", display: "block" }} alt="Floor plan" />

          {markers && markers.map(marker => (
            <div key={marker.id} style={{ position: "absolute", left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}>
              {/* Zone label above marker */}
              {marker.zone && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    left: "50%",
                    transform: "translate(-50%, -4px)",
                    background: "rgba(0, 0, 0, 0.8)",
                    color: "#fff",
                    padding: "2px 6px",
                    borderRadius: 3,
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                  }}
                >
                  {marker.zone}
                </div>
              )}

              {/* Marker square */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transform: "translate(-50%, -50%)",
                  width: hoveredMarker === marker.id ? 20 : 16,
                  height: hoveredMarker === marker.id ? 20 : 16,
                  background: hoveredMarker === marker.id ? "#0696D7" : "rgba(6, 150, 215, 0.8)",
                  border: "2px solid #fff",
                  borderRadius: 2,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: hoveredMarker === marker.id
                    ? "0 0 8px rgba(6, 150, 215, 0.8)"
                    : "0 2px 4px rgba(0,0,0,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 600,
                  pointerEvents: "auto"
                }}
                title={marker.label}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMarkerClick) {
                    onMarkerClick(marker);
                  }
                }}
                onMouseEnter={() => setHoveredMarker(marker.id)}
                onMouseLeave={() => setHoveredMarker(null)}
              >
                {marker.count || ""}
              </div>
            </div>
          ))}
        </div>
      </TransformComponent>
    </TransformWrapper>
  );
}
