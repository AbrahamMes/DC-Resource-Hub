import { useParams, Link } from "react-router-dom";
import data from "../data/building1.json";
import { useState } from "react";

export default function TTX1() {
  const { id } = useParams();

  // Accept old ids or the new 'ttx1' id
  if (!id || (id !== "1" && id !== "building1" && id !== "ttx1")) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Building not found</h1>
        <p>Select a building from the Buildings page.</p>
      </div>
    );
  }

  const floor = data.floors[0];
  const drawing = floor.drawings[0];

  // images for sidebar (default uses drawing.image)
  const images = {
    default: drawing.image,
    mcups: "/src/assets/TTX1_MCUPs.jpg",
    m23: "/src/assets/TTX1_M23.jpg",
    controlPanels: "/src/assets/TTX1_ControlPanel.jpg",
  };

  const [activeImageKey, setActiveImageKey] = useState("default");

  // areas positioned by percentage of image (left/top and size as %)
  const areas = [
    { id: 1, left: "18%", top: "22%", width: "8%", height: "5%" },
    { id: 2, left: "42%", top: "18%", width: "8%", height: "5%" },
    { id: 3, left: "70%", top: "28%", width: "8%", height: "5%" },
    { id: 4, left: "20%", top: "64%", width: "8%", height: "5%" },
    { id: 5, left: "48%", top: "60%", width: "8%", height: "5%" },
    { id: 6, left: "76%", top: "70%", width: "8%", height: "5%" },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h1>{data.name}</h1>
      <h2>
        {floor.name} – {drawing.name}
      </h2>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ width: "80%", position: "relative", outline: "2px solid rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <img src={images[activeImageKey]} alt="TTX1" style={{ width: "100%", display: "block" }} />

            {/* overlay buttons positioned by percentage, do not zoom */}
            {areas.map((a, idx) => {
              const names = ["NS1", "NS2", "DHA", "DHB", "DHC", "DHD"];
              const to = `/${names[idx].toLowerCase()}`;
              const label = names[idx];
              return (
                <Link
                  key={a.id}
                  to={to}
                  style={{
                    position: "absolute",
                    left: a.left,
                    top: a.top,
                    width: a.width,
                    height: a.height,
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.02)",
                    border: "2px solid rgba(0, 0, 0, 1)",
                    zIndex: 30,
                    backdropFilter: "blur(2px)",
                    color: "black",
                    textDecoration: "none",
                    borderRadius: 6,
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <aside style={{ width: "20%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => setActiveImageKey("default")}>Default view</button>
            <button onClick={() => setActiveImageKey("mcups")}>MCUPs</button>
            <button onClick={() => setActiveImageKey("m23")}>M23 Wires</button>
            <button onClick={() => setActiveImageKey("controlPanels")}>Control panel rooms</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
