import React from "react";
import { useState } from "react";
import FrameSelector from "../components/viewer/FrameSelector";
import ImageViewer from "../components/viewer/ImageViewer";

const frames = [
  { id: "1", label: "1", image: "/src/assets/TXESchedule_20251210.jpg" },
  { id: "2", label: "2", image: "/src/assets/schedule6Week.pdf" },
];


export default function Schedules() {
    const [activeFrameId, setActiveFrameId] = useState(frames[0].id);
    const activeFrame = frames.find(f => f.id === activeFrameId);
return (
    <>
    <div>
      <FrameSelector
        frames={frames}
        activeId={activeFrameId}
        onChange={setActiveFrameId}
      />
      <div style={{ marginTop: 16 }}>
        <ImageViewer
          imageSrc={activeFrame.image}
          markers={[]}
        />
      </div>
    </div>



    </>
);
}
