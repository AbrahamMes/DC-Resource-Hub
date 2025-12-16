import React, { useState } from "react";
import ImageViewer from "../components/viewer/ImageViewer";

export default function NS1() {
  const images = {
    default: "/src/assets/TTX1_NS1.jpg",
    m23: "/src/assets/TTX1_M23.jpg",
    m12: "/src/assets/TTX1_M12.jpg",
  };

  const [activeImageKey, setActiveImageKey] = useState("default");

  return (
    <div style={{ padding: 20 }}>
      <h1>NS1</h1>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginTop: 12 }}>
        <div style={{ width: "80%" }}>
          <ImageViewer imageSrc={images[activeImageKey]} markers={[]} />
        </div>

        <aside style={{ width: "20%" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => setActiveImageKey("default")}>Default View</button>
            <button onClick={() => setActiveImageKey("m23")}>M23 Wires</button>
            <button onClick={() => setActiveImageKey("m12")}>M12 Wires</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
