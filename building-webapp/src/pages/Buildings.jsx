import React from "react";
import { Link } from "react-router-dom";
import building1 from "../data/building1.json";

export default function Buildings() {
  const buildings = [
    { id: "1", name: building1.name, key: building1.id },
  ];

  return (
    <div>
      <h1>Buildings</h1>
      <ul>
        {buildings.map((b) => (
          <li key={b.key}>
            <Link to={`/buildings/${b.id}`}>{b.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
