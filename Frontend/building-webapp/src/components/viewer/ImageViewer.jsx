import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export default function ImageViewer({ imageSrc, markers }) {
  return (
    <TransformWrapper initialScale={1} minScale={0.5} maxScale={3}>
      <TransformComponent>
        <div style={{ position: "relative" }}>
          <img src={imageSrc} style={{ width: "100%", display: "block" }} />

          {markers.map(marker => (
            <div
              key={marker.id}
              style={{
                position: "absolute",
                left: `${marker.x * 100}%`,
                top: `${marker.y * 100}%`,
                transform: "translate(-50%, -50%)",
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "red",
                cursor: "pointer"
              }}
              title={marker.label}
            />
          ))}
        </div>
      </TransformComponent>
    </TransformWrapper>
  );
}
