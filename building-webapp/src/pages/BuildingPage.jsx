import { useParams } from "react-router-dom";
import data from "../data/building1.json";
import ImageViewer from "../components/viewer/ImageViewer";

export default function BuildingPage() {
  const { id } = useParams();

  // For now this app contains a single sample building (id '1').
  // When more buildings are added, replace this lookup with a data store.
  if (!id || (id !== "1" && id !== "building1")) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Building not found</h1>
        <p>Select a building from the Buildings page.</p>
      </div>
    );
  }

  const floor = data.floors[0];
  const drawing = floor.drawings[0];

  return (
    <div style={{ padding: 20 }}>
      <h1>{data.name}</h1>
      <h2>
        {floor.name} – {drawing.name}
      </h2>

      <ImageViewer imageSrc={drawing.image} markers={drawing.markers} />
    </div>
  );
}
