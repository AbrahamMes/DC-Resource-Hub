import React, { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useSite } from "../contexts/SiteContext";
import ImageViewer from "../components/viewer/ImageViewer";
import config from "../config";

const API_BASE_URL = config.apiBaseUrl;

export default function RoomView() {
  const { id: buildingId, roomId } = useParams();
  const { currentSite } = useSite();
  const [room, setRoom] = useState(null);
  const [building, setBuilding] = useState(null);
  const [assets, setAssets] = useState([]);
  const [accProjectId, setAccProjectId] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (currentSite && buildingId && roomId) {
      fetchRoom();
      fetchAssets();
    }
  }, [currentSite, buildingId, roomId]);

  const fetchRoom = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch building first to get building name
      const buildingResponse = await fetch(`${API_BASE_URL}/sites/${currentSite}/buildings/${buildingId}`, { credentials: "include" });
      const buildingData = await buildingResponse.json();

      if (!buildingData.success || !buildingData.building) {
        setError('Building not found');
        return;
      }

      setBuilding(buildingData.building);

      // Fetch room details
      const roomResponse = await fetch(`${API_BASE_URL}/sites/${currentSite}/buildings/${buildingId}/rooms/${roomId}`, { credentials: "include" });
      const roomData = await roomResponse.json();

      if (roomData.success && roomData.room) {
        setRoom(roomData.room);
      } else {
        setError('Room not found');
      }
    } catch (err) {
      console.error('Error fetching room:', err);
      setError('Failed to load room');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sites/${currentSite}/buildings/${buildingId}/rooms/${roomId}/assets`, { credentials: "include" });
      const data = await response.json();

      if (data.success) {
        setAssets(data.assets || []);
        setAccProjectId(data.accProjectId);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
    }
  };

  const handleMarkerClick = (marker) => {
    const asset = assets.find(a => a.id === marker.assetId);
    if (asset) {
      setSelectedAsset(asset);
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading room...</div>;
  }

  if (error || !room) {
    return <Navigate to={`/buildings/${buildingId}`} replace />;
  }

  // Get image URL from static API
  const imageUrl = room.images?.default
    ? `${API_BASE_URL}/static/${currentSite}/building/${room.images.default}`
    : null;

  // Create markers from room markers config and assets
  const markers = [];
  if (room.markers && Array.isArray(room.markers)) {
    room.markers.forEach(markerConfig => {
      // Find assets for this marker location
      const markerAssets = assets.filter(asset => {
        // Match by location zone/area if specified
        if (markerConfig.zone && asset.location) {
          return asset.location.includes(markerConfig.zone);
        }
        return false;
      });

      if (markerAssets.length > 0) {
        // Use the first asset for the marker
        markers.push({
          id: markerConfig.id,
          x: markerConfig.x,
          y: markerConfig.y,
          zone: markerConfig.zone,
          label: markerConfig.label || `${markerAssets.length} asset(s)`,
          count: markerAssets.length,
          assetId: markerAssets[0].id
        });
      } else if (markerConfig.alwaysShow) {
        // Show marker even if no assets
        markers.push({
          id: markerConfig.id,
          x: markerConfig.x,
          y: markerConfig.y,
          zone: markerConfig.zone,
          label: markerConfig.label || 'No assets',
          count: 0
        });
      }
    });
  }

  // Filter assets by search term
  const filteredAssets = searchTerm
    ? assets.filter(asset =>
        asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : assets;

  return (
    <div className="room-layout" style={{ display: "flex", height: "calc(100vh - 50px)" }}>
      {/* Main content area with floor plan */}
      <div className="room-main" style={{ flex: 1, padding: 20, overflowY: "auto" }}>
        {/* Breadcrumbs */}
        <div style={{ marginBottom: 20, fontSize: 14, color: '#888' }}>
          <Link to="/buildings" style={{ color: '#0696D7', textDecoration: 'none' }}>
            Buildings
          </Link>
          {' > '}
          <Link to={`/buildings/${buildingId}`} style={{ color: '#0696D7', textDecoration: 'none' }}>
            {building?.name || buildingId.toUpperCase()}
          </Link>
          {' > '}
          <span style={{ color: '#fff' }}>{room.name}</span>
        </div>

        <h1>{room.name}</h1>
        {room.fullName && (
          <p style={{ color: '#888', marginTop: 8, fontSize: 18 }}>{room.fullName}</p>
        )}

        <div style={{ marginTop: 12, marginBottom: 20, color: '#888', fontSize: 14 }}>
          {assets.length > 0 ? (
            <span>{assets.length} asset{assets.length !== 1 ? 's' : ''} in this room</span>
          ) : (
            <span>No assets found in this room</span>
          )}
        </div>

        {imageUrl ? (
          <div style={{ marginTop: 30 }}>
            <ImageViewer
              imageSrc={imageUrl}
              markers={markers}
              onMarkerClick={handleMarkerClick}
            />
            {markers.length === 0 && assets.length > 0 && (
              <p style={{ marginTop: 16, color: '#888', fontSize: 14, fontStyle: 'italic' }}>
                Note: Marker positions not configured yet. See sites.js to add marker coordinates.
              </p>
            )}
          </div>
        ) : (
          <div style={{
            marginTop: 30,
            padding: 60,
            border: '1px dashed #333',
            borderRadius: 8,
            textAlign: 'center',
            color: '#666'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📐</div>
            <p>No floor plan image available for this room yet.</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>
              Add an image to backend/data/{currentSite}/buildings/{room.images?.default || `${buildingId.toUpperCase()}_${roomId.toUpperCase()}.jpg`}
            </p>
          </div>
        )}
      </div>

      {/* Right sidebar with asset list */}
      <div className="room-sidebar" style={{
        width: 350,
        borderLeft: '1px solid #333',
        background: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* Sidebar header */}
        <div style={{ padding: 20, borderBottom: '1px solid #333' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Assets in Room</h2>
          <div style={{ marginTop: 12 }}>
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#0d0d0d',
                border: '1px solid #333',
                borderRadius: 4,
                color: '#fff',
                fontSize: 14
              }}
            />
          </div>
        </div>

        {/* Asset list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {filteredAssets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
              {searchTerm ? 'No assets match your search' : 'No assets in this room'}
            </div>
          ) : (
            filteredAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                style={{
                  padding: 12,
                  marginBottom: 8,
                  background: selectedAsset?.id === asset.id ? 'rgba(6, 150, 215, 0.15)' : '#0d0d0d',
                  border: selectedAsset?.id === asset.id ? '1px solid #0696D7' : '1px solid #222',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedAsset?.id !== asset.id) {
                    e.currentTarget.style.background = '#1a1a1a';
                    e.currentTarget.style.borderColor = '#333';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAsset?.id !== asset.id) {
                    e.currentTarget.style.background = '#0d0d0d';
                    e.currentTarget.style.borderColor = '#222';
                  }
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: '#fff', marginBottom: 4 }}>
                  {asset.name}
                </div>
                {asset.category && (
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
                    {asset.category}
                  </div>
                )}
                {asset.location && (
                  <div style={{ fontSize: 11, color: '#666' }}>
                    📍 {asset.location}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Selected asset details */}
        {selectedAsset && (
          <div style={{
            borderTop: '1px solid #333',
            padding: 20,
            background: '#0d0d0d',
            maxHeight: '40%',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Asset Details</h3>
              <button
                onClick={() => setSelectedAsset(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 4
                }}
              >
                ×
              </button>
            </div>

            <div style={{ fontSize: 14 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Name</div>
                <div style={{ color: '#fff', fontWeight: 600 }}>{selectedAsset.name}</div>
              </div>

              {selectedAsset.category && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Category</div>
                  <div style={{ color: '#fff' }}>{selectedAsset.category}</div>
                </div>
              )}

              {selectedAsset.location && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Location</div>
                  <div style={{ color: '#fff' }}>{selectedAsset.location}</div>
                </div>
              )}

              {selectedAsset.manufacturer && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Manufacturer</div>
                  <div style={{ color: '#fff' }}>{selectedAsset.manufacturer}</div>
                </div>
              )}

              {selectedAsset.model_number && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Model</div>
                  <div style={{ color: '#fff' }}>{selectedAsset.model_number}</div>
                </div>
              )}

              {selectedAsset.serial_number && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Serial Number</div>
                  <div style={{ color: '#fff' }}>{selectedAsset.serial_number}</div>
                </div>
              )}

              {selectedAsset.barcode && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Barcode</div>
                  <div style={{ color: '#fff', fontFamily: 'monospace' }}>{selectedAsset.barcode}</div>
                </div>
              )}

              {selectedAsset.status && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Status</div>
                  <div style={{ color: '#fff' }}>{selectedAsset.status}</div>
                </div>
              )}

              {/* ACC Link */}
              {accProjectId && selectedAsset.id && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #333' }}>
                  <a
                    href={`https://acc.autodesk.com/docs/files/projects/${accProjectId}?folderUrn=&objectId=${selectedAsset.id}&viewableGuid=`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 12px',
                      background: '#0696D7',
                      color: '#fff',
                      textDecoration: 'none',
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 600,
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#0580ba';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#0696D7';
                    }}
                  >
                    🔗 View in ACC
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
