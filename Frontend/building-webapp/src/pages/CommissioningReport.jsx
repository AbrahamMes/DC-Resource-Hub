import React, { useState, useEffect } from "react";
import { useSite } from "../contexts/SiteContext";
import * as XLSX from 'xlsx';
import config from "../config";

const API_BASE_URL = config.apiBaseUrl;

export default function CommissioningReport() {
  const { currentSite } = useSite();
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'log'

  // Form state
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [workPerformed, setWorkPerformed] = useState('');
  const [issues, setIssues] = useState('');
  const [needsWants, setNeedsWants] = useState('');
  const [delays, setDelays] = useState('');
  const [initials, setInitials] = useState('');

  // Data state
  const [locations, setLocations] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [entriesByDate, setEntriesByDate] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Log filter state
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterAsset, setFilterAsset] = useState('');
  const [filterInitials, setFilterInitials] = useState('');

  // Load locations on mount
  useEffect(() => {
    fetchLocations();
    if (activeTab === 'log') {
      fetchEntriesByDate();
    }
  }, [activeTab, currentSite]);

  // Load assets when location changes
  useEffect(() => {
    if (selectedLocation) {
      fetchAssetsByLocation(selectedLocation);
    } else {
      setAvailableAssets([]);
    }
  }, [selectedLocation, currentSite]);

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/commissioning/locations?site=${currentSite}`, { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  const fetchAssetsByLocation = async (location) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/commissioning/assets-by-location?site=${currentSite}&location=${encodeURIComponent(location)}`, { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setAvailableAssets(data.assets || []);
      }
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntriesByDate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/commissioning/entries-by-date?site=${currentSite}`, { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setEntriesByDate(data.entriesByDate || {});
      }
    } catch (err) {
      console.error('Failed to fetch entries:', err);
      setError('Failed to load commissioning log');
    } finally {
      setLoading(false);
    }
  };

  const handleAssetToggle = (assetId) => {
    setSelectedAssets(prev => {
      if (prev.includes(assetId)) {
        return prev.filter(id => id !== assetId);
      } else {
        return [...prev, assetId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLocation) {
      alert('Please select a location');
      return;
    }

    const userInitials = window.prompt('Please enter your initials to confirm submission:');
    if (!userInitials || userInitials.trim() === '') {
      return;
    }

    const entry = {
      location: selectedLocation,
      assets: selectedAssets.length > 0 ? selectedAssets : null,
      workPerformed: workPerformed.trim() || null,
      issues: issues.trim() || null,
      needsWants: needsWants.trim() || null,
      delays: delays.trim() || null,
      initials: userInitials.trim()
    };

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/commissioning/submit?site=${currentSite}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });

      const data = await response.json();
      if (data.success) {
        alert('Commissioning entry submitted successfully!');
        // Reset form
        setSelectedLocation('');
        setSelectedAssets([]);
        setWorkPerformed('');
        setIssues('');
        setNeedsWants('');
        setDelays('');
      } else {
        alert('Failed to submit entry: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error submitting entry:', err);
      alert('Error submitting entry: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = availableAssets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.description && asset.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportToExcel = () => {
    // Get filtered dates
    const filteredDates = Object.keys(entriesByDate).sort().reverse()
      .filter(date => {
        if (filterStartDate && date < filterStartDate) return false;
        if (filterEndDate && date > filterEndDate) return false;
        return true;
      });

    // Build Excel data
    const excelData = [];

    filteredDates.forEach(date => {
      const dateEntries = entriesByDate[date];

      // Filter entries
      const filteredEntries = dateEntries.filter(entry => {
        if (filterAsset) {
          if (!entry.assetNames) return false;
          const hasAsset = entry.assetNames.some(name =>
            name.toLowerCase().includes(filterAsset.toLowerCase())
          );
          if (!hasAsset) return false;
        }

        if (filterInitials) {
          if (!entry.initials) return false;
          if (!entry.initials.toLowerCase().includes(filterInitials.toLowerCase())) {
            return false;
          }
        }

        return true;
      });

      filteredEntries.forEach(entry => {
        excelData.push({
          'Date': date,
          'Location': entry.location,
          'Assets': entry.assetNames ? entry.assetNames.join(', ') : '',
          'Work Performed': entry.work_performed || '',
          'Issues': entry.issues || '',
          'Needs/Wants': entry.needs_wants || '',
          'Delays': entry.delays || '',
          'Initials': entry.initials,
          'Time': new Date(entry.submitted_at).toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        });
      });
    });

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Commissioning Log');

    // Auto-size columns
    const maxWidth = excelData.reduce((w, r) => {
      return Object.keys(r).map((k, i) => {
        const val = r[k] ? r[k].toString() : '';
        return Math.max(w[i] || 10, val.length, k.length);
      });
    }, []);
    worksheet['!cols'] = maxWidth.map(w => ({ wch: Math.min(w + 2, 50) }));

    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0];
    const filename = `Commissioning_Log_${today}.xlsx`;

    // Download
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="page-shell commissioning-page" style={{ padding: '10px 16px 16px' }}>
      <h1 style={{ margin: '0 0 6px', fontSize: '22px' }}>Commissioning Report</h1>

      {/* Tab Navigation */}
      <div className="tab-strip" style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '10px',
        borderBottom: '1px solid #dee2e6'
      }}>
        <button
          onClick={() => setActiveTab('form')}
          style={{
            padding: '6px 12px',
            backgroundColor: activeTab === 'form' ? '#0696D7' : 'transparent',
            color: activeTab === 'form' ? 'white' : '#495057',
            border: 'none',
            borderBottom: activeTab === 'form' ? '3px solid #0696D7' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          📝 Daily Form
        </button>
        <button
          onClick={() => setActiveTab('log')}
          style={{
            padding: '6px 12px',
            backgroundColor: activeTab === 'log' ? '#0696D7' : 'transparent',
            color: activeTab === 'log' ? 'white' : '#495057',
            border: 'none',
            borderBottom: activeTab === 'log' ? '3px solid #0696D7' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          📋 Commissioning Log
        </button>
      </div>

      {/* Form Tab */}
      {activeTab === 'form' && (
        <div style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 3px' }}>Daily Work Entry</h2>
          <p style={{ color: '#888', fontSize: '12px', margin: '0 0 10px' }}>
            Record daily commissioning work completed in a specific location
          </p>

          <form onSubmit={handleSubmit}>
            {/* Location Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Location: <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setSelectedAssets([]); // Clear asset selection when location changes
                }}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px'
                }}
              >
                <option value="">-- Select Location --</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Asset Selection */}
            {selectedLocation && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Asset(s): <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>(Optional - multiple selection)</span>
                </label>

                {/* Search Box */}
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginBottom: '10px',
                    fontSize: '14px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px'
                  }}
                />

                {/* Asset List */}
                <div style={{
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  padding: '10px',
                  backgroundColor: '#f8f9fa'
                }}>
                  {loading ? (
                    <p>Loading assets...</p>
                  ) : filteredAssets.length === 0 ? (
                    <p style={{ color: '#666' }}>
                      {availableAssets.length === 0
                        ? 'No synced assets found for this location'
                        : 'No assets match your search'}
                    </p>
                  ) : (
                    filteredAssets.map(asset => (
                      <div
                        key={asset.id}
                        style={{
                          padding: '8px',
                          marginBottom: '5px',
                          backgroundColor: 'white',
                          border: '1px solid #dee2e6',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        onClick={() => handleAssetToggle(asset.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset.id)}
                          onChange={() => handleAssetToggle(asset.id)}
                          style={{ marginRight: '10px' }}
                        />
                        <div>
                          <strong style={{ color: '#212529' }}>{asset.name}</strong>
                          {asset.description && (
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {asset.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {selectedAssets.length > 0 && (
                  <p style={{ marginTop: '5px', fontSize: '13px', color: '#495057' }}>
                    {selectedAssets.length} asset(s) selected
                  </p>
                )}
              </div>
            )}

            {/* Work Performed */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Work Performed: <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>(Optional)</span>
              </label>
              <textarea
                value={workPerformed}
                onChange={(e) => setWorkPerformed(e.target.value)}
                rows="3"
                placeholder="Describe work performed..."
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Issues */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Issues: <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>(Optional)</span>
              </label>
              <textarea
                value={issues}
                onChange={(e) => setIssues(e.target.value)}
                rows="3"
                placeholder="Describe any issues encountered..."
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Needs/Wants */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Needs/Wants: <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>(Optional)</span>
              </label>
              <textarea
                value={needsWants}
                onChange={(e) => setNeedsWants(e.target.value)}
                rows="3"
                placeholder="List any needs or wants..."
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Delays */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Delays: <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>(Optional)</span>
              </label>
              <textarea
                value={delays}
                onChange={(e) => setDelays(e.target.value)}
                rows="3"
                placeholder="Describe any delays..."
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedLocation}
              style={{
                padding: '12px 30px',
                backgroundColor: (!selectedLocation || loading) ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: (!selectedLocation || loading) ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Submitting...' : 'Submit Entry'}
            </button>
            <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              You will be prompted for your initials when you click submit
            </p>
          </form>
        </div>
      )}

      {/* Log Tab */}
      {activeTab === 'log' && (
        <div>
          <h2>Commissioning Log</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            View all commissioning entries grouped by date and location
          </p>

          {/* Filters */}
          {Object.keys(entriesByDate).length > 0 && (
            <div style={{
              display: 'flex',
              gap: '15px',
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              flexWrap: 'wrap'
            }}>
              <div style={{ minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#212529' }}>
                  Start Date:
                </label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '13px',
                    width: '100%'
                  }}
                />
              </div>

              <div style={{ minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#212529' }}>
                  End Date:
                </label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '13px',
                    width: '100%'
                  }}
                />
              </div>

              <div style={{ minWidth: '200px', flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#212529' }}>
                  Filter by Asset:
                </label>
                <input
                  type="text"
                  placeholder="Search asset name..."
                  value={filterAsset}
                  onChange={(e) => setFilterAsset(e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '13px',
                    width: '100%'
                  }}
                />
              </div>

              <div style={{ minWidth: '150px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#212529' }}>
                  Filter by Initials:
                </label>
                <input
                  type="text"
                  placeholder="Initials..."
                  value={filterInitials}
                  onChange={(e) => setFilterInitials(e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '13px',
                    width: '100%'
                  }}
                />
              </div>

              <div style={{ alignSelf: 'flex-end', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setFilterStartDate('');
                    setFilterEndDate('');
                    setFilterAsset('');
                    setFilterInitials('');
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
                <button
                  onClick={exportToExcel}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}
                >
                  📥 Download Excel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <p>Loading entries...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : Object.keys(entriesByDate).length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <h3>No entries yet</h3>
              <p>Submit your first commissioning entry using the Daily Form tab</p>
            </div>
          ) : (
            Object.keys(entriesByDate).sort().reverse()
              .filter(date => {
                // Apply date range filter
                if (filterStartDate && date < filterStartDate) return false;
                if (filterEndDate && date > filterEndDate) return false;
                return true;
              })
              .map(date => {
              const dateEntries = entriesByDate[date];

              // Filter entries by asset and initials if needed
              const filteredDateEntries = dateEntries.filter(entry => {
                // Asset filter
                if (filterAsset) {
                  if (!entry.assetNames) return false;
                  const hasAsset = entry.assetNames.some(name =>
                    name.toLowerCase().includes(filterAsset.toLowerCase())
                  );
                  if (!hasAsset) return false;
                }

                // Initials filter
                if (filterInitials) {
                  if (!entry.initials) return false;
                  if (!entry.initials.toLowerCase().includes(filterInitials.toLowerCase())) {
                    return false;
                  }
                }

                return true;
              });

              if (filteredDateEntries.length === 0) return null;

              // Group entries by location for this date
              const byLocation = filteredDateEntries.reduce((acc, entry) => {
                if (!acc[entry.location]) {
                  acc[entry.location] = {
                    assetNames: new Set(),
                    workPerformed: [],
                    issues: [],
                    needsWants: [],
                    delays: [],
                    submissions: []
                  };
                }

                // Collect all unique asset names (not IDs)
                if (entry.assetNames) {
                  entry.assetNames.forEach(assetName => acc[entry.location].assetNames.add(assetName));
                }

                // Collect non-empty entries
                if (entry.work_performed) {
                  acc[entry.location].workPerformed.push({
                    text: entry.work_performed,
                    initials: entry.initials,
                    time: entry.submitted_at
                  });
                }
                if (entry.issues) {
                  acc[entry.location].issues.push({
                    text: entry.issues,
                    initials: entry.initials,
                    time: entry.submitted_at
                  });
                }
                if (entry.needs_wants) {
                  acc[entry.location].needsWants.push({
                    text: entry.needs_wants,
                    initials: entry.initials,
                    time: entry.submitted_at
                  });
                }
                if (entry.delays) {
                  acc[entry.location].delays.push({
                    text: entry.delays,
                    initials: entry.initials,
                    time: entry.submitted_at
                  });
                }

                // Track all submissions for this location
                acc[entry.location].submissions.push({
                  initials: entry.initials,
                  time: entry.submitted_at
                });

                return acc;
              }, {});

              return (
                <div key={date} style={{ marginBottom: '30px' }}>
                  <h3 style={{
                    backgroundColor: '#0696D7',
                    color: 'white',
                    padding: '10px 15px',
                    borderRadius: '5px',
                    margin: '0 0 15px 0'
                  }}>
                    📅 {(() => {
                      // Parse date manually to avoid UTC timezone issues
                      const [year, month, day] = date.split('-').map(Number);
                      const localDate = new Date(year, month - 1, day);
                      return localDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                    })()}
                  </h3>

                  {Object.keys(byLocation).map(location => {
                    const locationData = byLocation[location];

                    return (
                      <div key={location} style={{
                        backgroundColor: 'white',
                        border: '1px solid #dee2e6',
                        borderRadius: '5px',
                        padding: '15px',
                        marginBottom: '15px'
                      }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#212529' }}>
                          📍 {location}
                        </h4>

                        {/* Assets */}
                        {locationData.assetNames.size > 0 && (
                          <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#212529' }}>Assets:</strong>{' '}
                            <span style={{ color: '#212529' }}>
                              {Array.from(locationData.assetNames).join(', ')}
                            </span>
                          </div>
                        )}

                        {/* Work Performed */}
                        {locationData.workPerformed.length > 0 && (
                          <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#212529' }}>Work Performed:</strong>
                            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                              {locationData.workPerformed.map((item, i) => (
                                <li key={i} style={{ color: '#212529' }}>
                                  {item.text}
                                  <span style={{ fontSize: '11px', color: '#666', marginLeft: '10px' }}>
                                    — {item.initials} at {new Date(item.time).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Issues */}
                        {locationData.issues.length > 0 && (
                          <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#212529' }}>Issues:</strong>
                            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                              {locationData.issues.map((item, i) => (
                                <li key={i} style={{ color: '#212529' }}>
                                  {item.text}
                                  <span style={{ fontSize: '11px', color: '#666', marginLeft: '10px' }}>
                                    — {item.initials} at {new Date(item.time).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Needs/Wants */}
                        {locationData.needsWants.length > 0 && (
                          <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#212529' }}>Needs/Wants:</strong>
                            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                              {locationData.needsWants.map((item, i) => (
                                <li key={i} style={{ color: '#212529' }}>
                                  {item.text}
                                  <span style={{ fontSize: '11px', color: '#666', marginLeft: '10px' }}>
                                    — {item.initials} at {new Date(item.time).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Delays */}
                        {locationData.delays.length > 0 && (
                          <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: '#212529' }}>Delays:</strong>
                            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                              {locationData.delays.map((item, i) => (
                                <li key={i} style={{ color: '#212529' }}>
                                  {item.text}
                                  <span style={{ fontSize: '11px', color: '#666', marginLeft: '10px' }}>
                                    — {item.initials} at {new Date(item.time).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
