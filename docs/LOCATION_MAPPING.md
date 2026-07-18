# Location mapping

Store each site's mapping at `{SITE_ID}/location_mapping.json` beneath `DATA_DIR`. The file maps ACC location text to building and room IDs defined in mounted `sites.json`.

```json
{
  "mappings": [
    {
      "accLocation": "Building A > Room 101",
      "buildingId": "building-a",
      "roomId": "room-101"
    }
  ],
  "patterns": []
}
```

Building and room IDs are case-sensitive and must match site configuration. Marker positions and room image names also belong in `sites.json`; image files belong beneath the configured `buildingsDir` in the data volume.
