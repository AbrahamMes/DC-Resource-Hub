import React, { useState, useEffect } from "react";
import config from "../config";

const API_BASE_URL = config.apiBaseUrl;

export default function Issues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [authStatus, setAuthStatus] = useState({ authenticated: false });
  const [syncStatus, setSyncStatus] = useState(null);
  const [showAuthSuccess, setShowAuthSuccess] = useState(false);

  // Filter and sort state
  const [titleFilter, setTitleFilter] = useState('');
  const [issueNumberFilter, setIssueNumberFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Open');
  const [sortOrder, setSortOrder] = useState('asc'); // asc = earliest first, desc = latest first

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
    fetchIssues();
    fetchSyncStatus();

    // Check for OAuth callback parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      // Remove query params from URL
      window.history.replaceState({}, '', '/issues');
      checkAuthStatus();
    } else if (params.get('error')) {
      setError(`Authentication error: ${params.get('error')}`);
      window.history.replaceState({}, '', '/issues');
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/status`, {
        credentials: 'include'
      });
      const data = await response.json();
      setAuthStatus(data);

      // Show auth success message if authenticated
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

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/issues`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        // Sort issues by due date (earliest first)
        const sortedIssues = (data.issues || []).sort((a, b) => {
          // Handle null/undefined due dates (put them at the end)
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          // Compare dates
          return new Date(a.due_date) - new Date(b.due_date);
        });
        setIssues(sortedIssues);
      } else {
        setError('Failed to fetch issues');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/issues/sync-status`, {
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
      setError('Please login first to sync issues from ACC');
      return;
    }

    setSyncing(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/issues/sync`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Successfully synced ${data.count} issues from ACC API`);
        fetchIssues();
        fetchSyncStatus();
      } else if (data.needsAuth) {
        setError('Session expired. Please login again.');
        setAuthStatus({ authenticated: false });
      } else {
        setError(data.error || 'Failed to sync issues');
      }
    } catch (err) {
      setError(`Sync failed: ${err.message}`);
    } finally {
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


  // Filter and sort issues
  const getFilteredAndSortedIssues = () => {
    let filtered = [...issues];

    // Filter by issue number
    if (issueNumberFilter) {
      filtered = filtered.filter(issue =>
        issue.display_id?.toString().includes(issueNumberFilter)
      );
    }

    // Filter by title
    if (titleFilter) {
      filtered = filtered.filter(issue =>
        issue.title?.toLowerCase().includes(titleFilter.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue =>
        issue.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Sort by due date
    filtered.sort((a, b) => {
      // Handle null/undefined due dates
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      // Compare dates
      const dateA = new Date(a.due_date);
      const dateB = new Date(b.due_date);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  };

  const filteredIssues = getFilteredAndSortedIssues();

  return (
    <div style={{ padding: '20px 20px' }}>
      <div style={{ marginBottom: '10px' }}>
        <h1 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>Issues</h1>
        <p style={{ margin: '0', color: '#666', fontSize: '13px' }}>ACC Issues assigned to the specified user</p>
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
        {!authStatus.authenticated ? (
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
              fontWeight: 'bold'
            }}
          >
            🔑 Login with Autodesk
          </button>
        ) : (
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
            {syncing ? '⏳ Syncing...' : '🔄 Re-query ACC API'}
          </button>
        )}

        {syncStatus && (
          <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#666' }}>
            <strong>Database:</strong> {syncStatus.total_issues} issues
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
      {issues.length > 0 && (
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
          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#a0a0a0' }}>
              Issue Number:
            </label>
            <input
              type="text"
              placeholder="e.g. 37190"
              value={issueNumberFilter}
              onChange={(e) => setIssueNumberFilter(e.target.value)}
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

          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#a0a0a0' }}>
              Search Title:
            </label>
            <input
              type="text"
              placeholder="Type to search..."
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
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
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#a0a0a0' }}>
              Sort by Due Date:
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
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
              <option value="asc">Earliest First</option>
              <option value="desc">Latest First</option>
            </select>
          </div>

          <div style={{ minWidth: '120px', alignSelf: 'flex-end' }}>
            <button
              onClick={() => {
                setIssueNumberFilter('');
                setTitleFilter('');
                setStatusFilter('Open');
                setSortOrder('asc');
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

      {/* Issues Table */}
      {loading && issues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading issues...</p>
        </div>
      ) : issues.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h3>No issues found</h3>
          <p>Click "Re-query ACC API" to sync issues from Autodesk Construction Cloud</p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            (You must be logged in first)
          </p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px'
        }}>
          <h3>No issues match your filters</h3>
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
                <th style={tableHeaderStyle}>ID</th>
                <th style={tableHeaderStyle}>Title</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Assigned To</th>
                <th style={tableHeaderStyle}>Created</th>
                <th style={tableHeaderStyle}>Due Date</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((issue, index) => {
                // Check if issue is overdue and open
                const isOverdue = issue.due_date &&
                  new Date(issue.due_date) < new Date() &&
                  issue.status?.toLowerCase() === 'open';

                return (
                  <tr
                    key={issue.id || index}
                    style={{
                      borderBottom: '1px solid #dee2e6',
                      backgroundColor: isOverdue ? '#ffcccc' : 'transparent',
                      ':hover': { backgroundColor: '#f8f9fa' }
                    }}
                  >
                  <td style={tableCellStyle}>
                    {issue.display_id ? (
                      <strong style={{ fontSize: '14px', color: '#0696D7' }}>
                        #{issue.display_id}
                      </strong>
                    ) : (
                      <code style={{ fontSize: '11px' }}>
                        {issue.id || 'N/A'}
                      </code>
                    )}
                  </td>
                  <td style={{ ...tableCellStyle, maxWidth: '400px' }}>
                    <strong>{issue.title || 'Untitled'}</strong>
                    {issue.description && (
                      <div style={{
                        fontSize: '12px',
                        color: '#666',
                        marginTop: '4px',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                      }}>
                        {issue.description}
                      </div>
                    )}
                  </td>
                  <td style={tableCellStyle}>
                    <span style={getStatusStyle(issue.status)}>
                      {issue.status || 'N/A'}
                    </span>
                  </td>
                  <td style={tableCellStyle}>{issue.assigned_to || 'N/A'}</td>
                  <td style={tableCellStyle}>{formatDate(issue.created_at)}</td>
                  <td style={tableCellStyle}>{formatDate(issue.due_date)}</td>
                  <td style={tableCellStyle}>
                    <button
                      onClick={() => {
                        const projectId = 'b38e25ea-eca5-4a70-9f0b-85eeb399056f';
                        const url = `https://acc.autodesk.com/build/issues/projects/${projectId}/issues?issueId=${issue.id}`;
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>💡 <strong>Tip:</strong> Login with your Autodesk account to sync issues from ACC API</p>
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
    'open': { backgroundColor: '#d1ecf1', color: '#0c5460' },
    'closed': { backgroundColor: '#d4edda', color: '#155724' },
    'in_progress': { backgroundColor: '#fff3cd', color: '#856404' },
    'pending': { backgroundColor: '#f8d7da', color: '#721c24' }
  };

  return {
    ...baseStyle,
    ...(statusColors[status?.toLowerCase()] || { backgroundColor: '#e9ecef', color: '#495057' })
  };
};

const getPriorityStyle = (priority) => {
  const baseStyle = {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  };

  const priorityColors = {
    'high': { backgroundColor: '#f8d7da', color: '#721c24' },
    'medium': { backgroundColor: '#fff3cd', color: '#856404' },
    'low': { backgroundColor: '#d4edda', color: '#155724' }
  };

  return {
    ...baseStyle,
    ...(priorityColors[priority?.toLowerCase()] || { backgroundColor: '#e9ecef', color: '#495057' })
  };
};
