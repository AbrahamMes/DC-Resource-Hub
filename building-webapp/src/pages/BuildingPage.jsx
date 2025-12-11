import data from "../data/building1.json";
import ImageViewer from "../components/viewer/ImageViewer";

export default function BuildingPage() {
  const floor = data.floors[0];
  const drawing = floor.drawings[0];

  return (
    <div style={{ padding: 20 }}>
      <h1>{data.name}</h1>
      <h2>{floor.name} – {drawing.name}</h2>

      <ImageViewer
        imageSrc={drawing.image}
        markers={drawing.markers}
      />
    </div>
  );
}
