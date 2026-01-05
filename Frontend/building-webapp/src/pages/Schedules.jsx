import React from "react";
import { useState } from "react";
import FrameSelector from "../components/viewer/FrameSelector";
import ImageViewer from "../components/viewer/ImageViewer";

const frames = [
  { id: "1", label: "Schedule JPG", image: "/src/assets/TXESchedule_20251210.jpg" },
  { id: "2", label: "6-Week PDF", image: "/src/assets/schedule6Week.pdf" },
];

function isPdf(src) {
  return typeof src === "string" && src.toLowerCase().endsWith(".pdf");
}

export default function Schedules() {
  const [activeFrameId, setActiveFrameId] = useState(frames[1].id);
  const activeFrame = frames.find((f) => f.id === activeFrameId) || frames[1];

  const pdfUrlWithZoom = (src, zoom) => {
    if (!src) return src;
    // Only add zoom anchor if not already present
    if (src.includes('#')) return src;
    return `${src}#zoom=${zoom}`;
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Schedules</h1>
        <p style={{ color: '#a0a0a0', fontSize: '14px' }}>
          View project schedules and timeline documents
        </p>
      </div>

      <div style={{
        backgroundColor: '#1e1e1e',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <FrameSelector frames={frames} activeId={activeFrameId} onChange={setActiveFrameId} />
      </div>

      <div style={{
        backgroundColor: '#1e1e1e',
        border: '1px solid #333',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {isPdf(activeFrame.image) ? (
          <div style={{ width: "100%", height: "80vh" }}>
            <object
              data={activeFrame.id === "2" ? pdfUrlWithZoom(activeFrame.image, 200) : activeFrame.image}
              type="application/pdf"
              width="100%"
              height="100%"
            >
              <iframe
                src={activeFrame.id === "2" ? pdfUrlWithZoom(activeFrame.image, 200) : activeFrame.image}
                title={activeFrame.label}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </object>
          </div>
        ) : (
          <ImageViewer imageSrc={activeFrame.image} markers={[]} />
        )}
      </div>
    </div>
  );
}
