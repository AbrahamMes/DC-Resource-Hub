import React, { useState, useEffect } from "react";
import config from "../config";

const API_BASE_URL = config.apiBaseUrl;

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const [error, setError] = useState(null);
  const [authStatus, setAuthStatus] = useState({ authenticated: false });
  const [syncStatus, setSyncStatus] = useState(null);
  const [showAuthSuccess, setShowAuthSuccess] = useState(false);

  // Filter and search state
  const [nameFilter, setNameFilter] = useState('');
  const [barcodeFilter, setBarcodeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
    fetchAssets();
    fetchSyncStatus();

    // Check for OAuth callback parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      window.history.replaceState({}, '', '/assets');
      checkAuthStatus();
    } else if (params.get('error')) {
      setError(`Authentication error: ${params.get('error')}`);
      window.history.replaceState({}, '', '/assets');
    }
  }, []);

  // Extract unique categories and statuses when assets change
  useEffect(() => {
    if (assets.length > 0) {
      const uniqueCategories = [...new Set(assets.map(a => a.category).filter(Boolean))].sort();
      const uniqueStatuses = [...new Set(assets.map(a => a.status).filter(Boolean))].sort();
      setCategories(uniqueCategories);
      setStatuses(uniqueStatuses);
    }
  }, [assets]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/status`, {
        credentials: 'include'
      });
      const data = await response.json();
      setAuthStatus(data);

      if (data.authenticated) {
        setShowAuthSuccess(true);
      }
    } catch (err) {
      console.error('Failed to check auth status:', err);
    }
  };

  // Auto-hide auth success message after 3 seconds
  useEffect(() => {
    if (showAuthSuccess) {
      const timer = setTimeout(() => {
        setShowAuthSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showAuthSuccess]);

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/assets`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setAssets(data.assets || []);
      } else {
        setError('Failed to fetch assets');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/sync-status`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setSyncStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch sync status:', err);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`);
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      setError(`Login failed: ${err.message}`);
    }
  };

  const handleSync = async () => {
    if (!authStatus.authenticated) {
      setError('Please login first to sync assets from ACC');
      return;
    }

    // Prompt for PIN
    const pin = window.prompt('This will re-sync all assets from ACC (~11,000+ assets).\n\nPlease enter PIN to confirm:');
    if (!pin) {
      return; // User cancelled
    }

    setSyncing(true);
    setSyncProgress(null);
    setError(null);

    try {
      const eventSource = new EventSource(`${API_BASE_URL}/assets/sync-progress?pin=${encodeURIComponent(pin)}`, {
        withCredentials: true
      });

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.error) {
          setError(data.error);
          if (data.needsAuth) {
            setAuthStatus({ authenticated: false });
          }
          if (data.needsPin) {
            alert(data.error);
          }
          eventSource.close();
          setSyncing(false);
          return;
        }

        if (data.stage === 'complete') {
          setSyncProgress(data);
          eventSource.close();
          setSyncing(false);
          alert(`Successfully synced ${data.count} assets from ACC API\n\nTotal stored: ${data.count}\nMatching Excel: ${data.excelMatches || 'N/A'}\nExcel count: ${data.excelCount}\nAPI Requests: ${data.requestCount}`);
          fetchAssets();
          fetchSyncStatus();
        } else if (data.stage === 'error') {
          setError(data.error || 'Failed to sync assets');
          eventSource.close();
          setSyncing(false);
        } else {
          // Update progress
          setSyncProgress(data);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE error:', err);
        setError('Connection error during sync');
        eventSource.close();
        setSyncing(false);
      };

    } catch (err) {
      setError(`Sync failed: ${err.message}`);
      setSyncing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Filter assets
  const getFilteredAssets = () => {
    let filtered = [...assets];

    // Filter by name
    if (nameFilter) {
      filtered = filtered.filter(asset =>
        asset.name?.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    // Filter by barcode
    if (barcodeFilter) {
      filtered = filtered.filter(asset =>
        asset.barcode?.toLowerCase().includes(barcodeFilter.toLowerCase())
      );
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(asset =>
        asset.category === categoryFilter
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(asset =>
        asset.status === statusFilter
      );
    }

    return filtered;
  };

  const filteredAssets = getFilteredAssets();

  return (
    <div style={{ padding: '20px 20px' }}>
      <div style={{ marginBottom: '10px' }}>
        <h1 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>Assets</h1>
        <p style={{ margin: '0', color: '#666', fontSize: '13px' }}>ACC Assets filtered by Asset List Excel file</p>
      </div>

      {/* Action Bar */}
      <div style={{
        marginBottom: '10px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        {!authStatus.authenticated && (
          <button
            onClick={handleLogin}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0696D7',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginRight: '10px'
            }}
          >
            🔑 Login with Autodesk
          </button>
        )}

        <button
          onClick={handleSync}
          disabled={syncing}
          style={{
            padding: '10px 20px',
            backgroundColor: syncing ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: syncing ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {syncing ? (
            syncProgress ? (
              syncProgress.stage === 'excel' ? '📋 Reading Excel...' :
              syncProgress.stage === 'fetching' ? `⏳ Fetching... (${syncProgress.totalFetched} assets, ${syncProgress.requestCount} API requests)` :
              syncProgress.stage === 'saving' ? '💾 Saving to database...' :
              '⏳ Syncing...'
            ) : '⏳ Starting sync...'
          ) : '🔄 Re-query ACC API'}
        </button>

        {syncStatus && (
          <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
            <strong>Database:</strong> {syncStatus.total_assets} assets
            {syncStatus.last_sync && (
              <> | <strong>Last Sync:</strong> {formatDate(syncStatus.last_sync)}</>
            )}
          </div>
        )}
      </div>

      {/* Auth Status */}
      {showAuthSuccess && (
        <div style={{
          marginBottom: '10px',
          padding: '8px 10px',
          backgroundColor: '#d4edda',
          borderRadius: '5px',
          color: '#155724',
          fontSize: '13px'
        }}>
          ✅ Authenticated with Autodesk
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          marginBottom: '10px',
          padding: '8px 10px',
          backgroundColor: '#f8d7da',
          borderRadius: '5px',
          color: '#721c24',
          fontSize: '13px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Filter Controls */}
      {assets.length > 0 && (
        <div style={{
          marginBottom: '10px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#a0a0a0' }}>
              Search by Name:
            </label>
            <input
              type="text"
              placeholder="Type to search..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#212529',
                backgroundColor: '#fff'
              }}
            />
          </div>

          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#a0a0a0' }}>
              Search by Barcode:
            </label>
            <input
              type="text"
              placeholder="Barcode..."
              value={barcodeFilter}
              onChange={(e) => setBarcodeFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#212529',
                backgroundColor: '#fff'
              }}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#a0a0a0' }}>
              Filter by Category:
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#212529',
                backgroundColor: '#fff'
              }}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#a0a0a0' }}>
              Filter by Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#212529',
                backgroundColor: '#fff'
              }}
            >
              <option value="all">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '120px', alignSelf: 'flex-end' }}>
            <button
              onClick={() => {
                setNameFilter('');
                setBarcodeFilter('');
                setCategoryFilter('all');
                setStatusFilter('all');
              }}
              style={{
                padding: '8px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold'
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Assets Table */}
      {loading && assets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading assets...</p>
        </div>
      ) : assets.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h3>No assets found</h3>
          <p>Assets have not been synced yet.</p>
          <p>Click "Re-query ACC API" to sync assets from Autodesk Construction Cloud (login required)</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px'
        }}>
          <h3>No assets match your filters</h3>
          <p>Try adjusting your search criteria or click "Clear Filters"</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={tableHeaderStyle}>Name</th>
                <th style={tableHeaderStyle}>Barcode</th>
                <th style={tableHeaderStyle}>Category</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Location</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset, index) => (
                <tr
                  key={asset.id || index}
                  style={{
                    borderBottom: '1px solid #dee2e6'
                  }}
                >
                  <td style={{ ...tableCellStyle, maxWidth: '300px' }}>
                    <strong>{asset.name || 'N/A'}</strong>
                    {asset.description && (
                      <div style={{
                        fontSize: '12px',
                        color: '#666',
                        marginTop: '4px',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                      }}>
                        {asset.description}
                      </div>
                    )}
                  </td>
                  <td style={tableCellStyle}>
                    {asset.barcode ? (
                      <code style={{ fontSize: '12px', backgroundColor: '#f8f9fa', padding: '2px 6px', borderRadius: '3px' }}>
                        {asset.barcode}
                      </code>
                    ) : 'N/A'}
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ fontSize: '12px', maxWidth: '200px', wordWrap: 'break-word' }}>
                      {asset.category || 'N/A'}
                    </div>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={getStatusStyle(asset.status)}>
                      {asset.status || 'N/A'}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    <div style={{ fontSize: '12px', maxWidth: '200px', wordWrap: 'break-word' }}>
                      {asset.location || 'N/A'}
                    </div>
                  </td>
                  <td style={tableCellStyle}>
                    <button
                      onClick={() => {
                        const projectId = 'b38e25ea-eca5-4a70-9f0b-85eeb399056f';
                        const url = `https://acc.autodesk.com/build/assets/projects/${projectId}/assets?assetId=${asset.id}`;
                        window.open(url, '_blank');
                      }}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#0696D7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#0575b3'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#0696D7'}
                    >
                      🔗 Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>💡 <strong>Tip:</strong> Login with your Autodesk account to sync assets from ACC API. Only assets listed in the Excel file will be synced.</p>
      </div>
    </div>
  );
}

// Styles
const tableHeaderStyle = {
  padding: '12px',
  textAlign: 'left',
  fontWeight: 'bold',
  borderBottom: '2px solid #dee2e6',
  fontSize: '14px',
  color: '#212529'
};

const tableCellStyle = {
  padding: '12px',
  fontSize: '13px',
  color: '#212529'
};

const getStatusStyle = (status) => {
  const baseStyle = {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  };

  const statusColors = {
    'active': { backgroundColor: '#d4edda', color: '#155724' },
    'inactive': { backgroundColor: '#f8d7da', color: '#721c24' },
    'pending': { backgroundColor: '#fff3cd', color: '#856404' },
    'in_progress': { backgroundColor: '#d1ecf1', color: '#0c5460' }
  };

  return {
    ...baseStyle,
    ...(statusColors[status?.toLowerCase()] || { backgroundColor: '#e9ecef', color: '#495057' })
  };
};
