import React, { useState, useEffect } from "react";
import { useSite } from "../contexts/SiteContext";
import AccProjectSelector, { getSavedAccProjectId } from "../components/AccProjectSelector";
import config from "../config";

const API_BASE_URL = config.apiBaseUrl;
const STATUS_OPTIONS = ["Open", "Closed", "Completed", "In Progress", "Pending"];

export default function Issues() {
  const { currentSite, availableSites } = useSite();
  const currentSiteConfig = availableSites.find((site) => site.id === currentSite);
  const projects = currentSiteConfig?.accProjects || [];
  const [projectId, setProjectId] = useState("");

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [authStatus, setAuthStatus] = useState({ authenticated: false });
  const [syncStatus, setSyncStatus] = useState(null);
  const [showAuthSuccess, setShowAuthSuccess] = useState(false);

  const [titleFilter, setTitleFilter] = useState("");
  const [issueNumberFilter, setIssueNumberFilter] = useState("");
  const [statusFilters, setStatusFilters] = useState(["Open"]);
  const [sortOrder, setSortOrder] = useState("asc");
  const [expandedIssueId, setExpandedIssueId] = useState(null);

  useEffect(() => {
    const savedProjectId = getSavedAccProjectId(
      currentSite,
      projects,
      currentSiteConfig?.defaultAccProjectId
    );
    if (savedProjectId !== projectId) {
      setProjectId(savedProjectId);
      return;
    }

    if (currentSite && projectId) {
      checkAuthStatus();
      fetchIssues();
      fetchSyncStatus();
    }
  }, [currentSite, projectId, currentSiteConfig]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("auth") === "success") {
      window.history.replaceState({}, "", "/issues");
      checkAuthStatus();
    } else if (params.get("error")) {
      setError(`Authentication error: ${params.get("error")}`);
      window.history.replaceState({}, "", "/issues");
    }
  }, []);

  useEffect(() => {
    if (showAuthSuccess) {
      const timer = setTimeout(() => {
        setShowAuthSuccess(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showAuthSuccess]);

  useEffect(() => {
    if (!currentSite || !projectId) return undefined;

    const timer = setInterval(() => {
      fetchSyncStatus();
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, [currentSite, projectId]);

  async function checkAuthStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/status`, {
        credentials: "include"
      });

      const data = await response.json();
      setAuthStatus(data);

      if (data.authenticated) {
        setShowAuthSuccess(true);
      }
    } catch (err) {
      console.error("Failed to check auth status:", err);
    }
  }

  async function fetchIssues() {
    if (!currentSite) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/issues?site=${currentSite}&projectId=${encodeURIComponent(projectId)}`, {
        credentials: "include"
      });

      const data = await response.json();

      if (data.success) {
        const sortedIssues = (data.issues || []).sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;

          return new Date(a.due_date) - new Date(b.due_date);
        });

        setIssues(sortedIssues);
      } else {
        setError(data.error || "Failed to fetch issues");
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSyncStatus() {
    if (!currentSite) return;

    try {
      const response = await fetch(`${API_BASE_URL}/issues/sync-status?site=${currentSite}&projectId=${encodeURIComponent(projectId)}`, {
        credentials: "include"
      });

      const data = await response.json();

      if (data.success) {
        setSyncStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch sync status:", err);
    }
  }

  async function handleLogin() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, { credentials: "include" });
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      setError(`Login failed: ${err.message}`);
    }
  }

  async function handleSync() {
    if (!authStatus.authenticated) {
      setError("Please login first to sync issues from ACC");
      return;
    }

    if (!currentSite) return;

    setSyncing(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/issues/sync?site=${currentSite}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ projectId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Successfully synced ${data.count} issues from ACC API`);
        await fetchIssues();
        await fetchSyncStatus();
      } else if (data.needsAuth) {
        setError("Session expired. Please login again.");
        setAuthStatus({ authenticated: false });
      } else {
        setError(data.error || "Failed to sync issues");
      }
    } catch (err) {
      setError(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "N/A";

    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  }

  function formatDateTime(dateString) {
    if (!dateString) return "N/A";

    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }

  function getFilteredAndSortedIssues() {
    let filtered = [...issues];

    if (issueNumberFilter) {
      filtered = filtered.filter((issue) =>
        issue.display_id?.toString().includes(issueNumberFilter)
      );
    }

    if (titleFilter) {
      filtered = filtered.filter((issue) =>
        issue.title?.toLowerCase().includes(titleFilter.toLowerCase())
      );
    }

    if (statusFilters.length < STATUS_OPTIONS.length) {
      filtered = filtered.filter((issue) =>
        statusFilters.some((status) =>
          issue.status?.toLowerCase() === status.toLowerCase()
        )
      );
    }

    filtered.sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;

      const dateA = new Date(a.due_date);
      const dateB = new Date(b.due_date);

      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }

  const filteredIssues = getFilteredAndSortedIssues();

  const openIssueInAcc = (issue) => {
    const url = `https://acc.autodesk.com/build/issues/projects/${projectId}/issues?issueId=${issue.id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="page-shell data-page" style={{ padding: "20px 20px" }}>
      <div style={{ marginBottom: "10px" }}>
        <h1 style={{ margin: "0 0 5px 0", fontSize: "24px" }}>Issues</h1>
        <p style={{ margin: "0", color: "#a0a0a0", fontSize: "13px" }}>
          ACC Issues synced using the site issue filters
        </p>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <AccProjectSelector siteId={currentSite} value={projectId} onChange={setProjectId} />
      </div>

      <div className="page-action-bar" style={{
        marginBottom: "10px",
        display: "flex",
        gap: "10px",
        alignItems: "center",
        padding: "10px",
        backgroundColor: "#f5f5f5",
        borderRadius: "8px"
      }}>
        {!authStatus.authenticated ? (
          <button
            onClick={handleLogin}
            style={{
              padding: "10px 20px",
              backgroundColor: "#0696D7",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          >
            🔑 Login with Autodesk
          </button>
        ) : (
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: "10px 20px",
              backgroundColor: syncing ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: syncing ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "bold"
            }}
          >
            {syncing ? "⏳ Syncing..." : "🔄 Re-query ACC API"}
          </button>
        )}

        {syncStatus && (
          <div style={{ marginLeft: "auto", fontSize: "14px", color: "#666" }}>
            <strong>Database:</strong> {syncStatus.total_issues} issues
            {(syncStatus.last_success_at || syncStatus.last_sync) && (
              <> | <strong>Last Successful Refresh:</strong>{" "}
                {formatDateTime(syncStatus.last_success_at || syncStatus.last_sync)}
              </>
            )}
            {syncStatus.last_trigger && (
              <> | <strong>Source:</strong> {syncStatus.last_trigger}</>
            )}
            {syncStatus.last_error && (
              <div style={{ marginTop: "5px", color: "#b42318", fontWeight: 600 }}>
                Refresh failed {syncStatus.last_failure_at
                  ? formatDateTime(syncStatus.last_failure_at)
                  : ""}: {syncStatus.last_error}
              </div>
            )}
          </div>
        )}
      </div>

      {showAuthSuccess && (
        <div className="page-filters" style={{
          marginBottom: "10px",
          padding: "8px 10px",
          backgroundColor: "#d4edda",
          borderRadius: "5px",
          color: "#155724",
          fontSize: "13px"
        }}>
          ✅ Authenticated with Autodesk
        </div>
      )}

      {error && (
        <div style={{
          marginBottom: "10px",
          padding: "8px 10px",
          backgroundColor: "#f8d7da",
          borderRadius: "5px",
          color: "#721c24",
          fontSize: "13px"
        }}>
          ⚠️ {error}
        </div>
      )}

      {issues.length > 0 && (
        <div style={{
          marginBottom: "10px",
          padding: "10px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          <div style={{ minWidth: "150px" }}>
            <label style={filterLabelStyle}>Issue Number:</label>
            <input
              type="text"
              placeholder="e.g. 37190"
              value={issueNumberFilter}
              onChange={(e) => setIssueNumberFilter(e.target.value)}
              style={filterInputStyle}
            />
          </div>

          <div style={{ flex: "1", minWidth: "220px" }}>
            <label style={filterLabelStyle}>Search Title:</label>
            <input
              type="text"
              placeholder="Type to search..."
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              style={filterInputStyle}
            />
          </div>

          <div style={statusFilterGroupStyle}>
            <label style={filterLabelStyle}>Filter by Status:</label>
            <details style={statusDropdownStyle}>
              <summary style={statusDropdownSummaryStyle}>
                {statusFilters.length === STATUS_OPTIONS.length
                  ? "All Statuses"
                  : statusFilters.length === 0
                    ? "No Statuses"
                    : statusFilters.join(", ")}
              </summary>
              <div style={statusCheckboxesStyle}>
                <label style={statusCheckboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={statusFilters.length === STATUS_OPTIONS.length}
                    onChange={(event) => {
                      setStatusFilters(event.target.checked ? [...STATUS_OPTIONS] : []);
                    }}
                  />
                  All Statuses
                </label>
                {STATUS_OPTIONS.map((status) => (
                  <label key={status} style={statusCheckboxLabelStyle}>
                    <input
                      type="checkbox"
                      checked={statusFilters.includes(status)}
                      onChange={(event) => {
                        setStatusFilters((current) => event.target.checked
                          ? [...current, status]
                          : current.filter((value) => value !== status));
                      }}
                    />
                    {status}
                  </label>
                ))}
              </div>
            </details>
          </div>

          <div style={{ minWidth: "150px" }}>
            <label style={filterLabelStyle}>Sort by Due Date:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={filterInputStyle}
            >
              <option value="asc">Earliest First</option>
              <option value="desc">Latest First</option>
            </select>
          </div>

          <div style={{ minWidth: "120px", alignSelf: "flex-end" }}>
            <button
              onClick={() => {
                setIssueNumberFilter("");
                setTitleFilter("");
                setStatusFilters(["Open"]);
                setSortOrder("asc");
              }}
              style={{
                padding: "8px 15px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "bold"
              }}
            >
              Clear Filters
            </button>
          </div>

          <div style={{
            width: "100%",
            fontSize: "13px",
            color: "#666",
            marginTop: "2px"
          }}>
            Showing <strong>{filteredIssues.length}</strong> of <strong>{issues.length}</strong> synced issues
          </div>
        </div>
      )}

      {loading && issues.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Loading issues...</p>
        </div>
      ) : issues.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "40px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px"
        }}>
          <h3>No issues found</h3>
          <p>Click "Re-query ACC API" to sync issues from Autodesk Construction Cloud.</p>
          <p style={{ fontSize: "12px", color: "#666" }}>
            You must be logged in first.
          </p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "40px",
          backgroundColor: "#fff3cd",
          borderRadius: "8px"
        }}>
          <h3>No issues match your filters</h3>
          <p>Try changing the status filter or clearing the issue number/title search.</p>
        </div>
      ) : (
        <div className="table-scroll" style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
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
                const isOverdue = issue.due_date &&
                  new Date(issue.due_date) < new Date() &&
                  issue.status?.toLowerCase() === "open";

                return (
                  <React.Fragment key={issue.id || index}>
                  <tr
                    onClick={() => setExpandedIssueId(expandedIssueId === issue.id ? null : issue.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setExpandedIssueId(expandedIssueId === issue.id ? null : issue.id);
                      }
                    }}
                    tabIndex={0}
                    aria-expanded={expandedIssueId === issue.id}
                    style={{
                      borderBottom: "1px solid #dee2e6",
                      backgroundColor: isOverdue ? "#ffcccc" : "transparent",
                      cursor: "pointer"
                    }}
                  >
                    <td style={tableCellStyle}>
                      {issue.display_id ? (
                        <strong style={{ fontSize: "14px", color: "#0696D7" }}>
                          #{issue.display_id}
                        </strong>
                      ) : (
                        <code style={{ fontSize: "11px" }}>
                          {issue.id || "N/A"}
                        </code>
                      )}
                    </td>

                    <td style={{ ...tableCellStyle, maxWidth: "400px" }}>
                      <strong>{issue.title || "Untitled"}</strong>

                      {issue.description && (
                        <div style={{
                          fontSize: "12px",
                          color: "#666",
                          marginTop: "4px",
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                          overflowWrap: "break-word"
                        }}>
                          {issue.description}
                        </div>
                      )}
                    </td>

                    <td style={tableCellStyle}>
                      <span style={getStatusStyle(issue.status)}>
                        {issue.status || "N/A"}
                      </span>
                    </td>

                    <td style={tableCellStyle}>
                      {issue.assigned_to || issue.assigned_to_id || "N/A"}
                    </td>

                    <td style={tableCellStyle}>
                      {formatDate(issue.created_at)}
                    </td>

                    <td style={tableCellStyle}>
                      {formatDate(issue.due_date)}
                    </td>

                    <td style={tableCellStyle}>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setExpandedIssueId(expandedIssueId === issue.id ? null : issue.id);
                        }}
                        style={{
                          padding: "4px 8px",
                          marginRight: "6px",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        {expandedIssueId === issue.id ? "Hide details" : "Details"}
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openIssueInAcc(issue);
                        }}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#0696D7",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "bold"
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = "#0575b3"}
                        onMouseOut={(e) => e.target.style.backgroundColor = "#0696D7"}
                      >
                        🔗 Link
                      </button>
                    </td>
                  </tr>
                  {expandedIssueId === issue.id && (
                    <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>
                      <td colSpan={7} style={{ padding: "14px 18px" }}>
                        <div style={issueDetailsGridStyle}>
                          <IssueDetail label="Issue ID" value={issue.id} />
                          <IssueDetail label="Assigned To" value={issue.assigned_to} />
                          <IssueDetail label="Assignee ID" value={issue.assigned_to_id} />
                          <IssueDetail label="Assignee Type" value={issue.assigned_to_type} />
                          <IssueDetail label="Priority" value={issue.priority} />
                          <IssueDetail label="Issue Type" value={issue.issue_type} />
                          <IssueDetail label="Issue Type ID" value={issue.issue_type_id} />
                          <IssueDetail label="Issue Subtype ID" value={issue.issue_subtype_id} />
                          <IssueDetail label="Root Cause" value={issue.root_cause} />
                          <IssueDetail label="Location" value={issue.location_description} />
                          <IssueDetail label="Location ID" value={issue.location_id} />
                          <IssueDetail label="Owner" value={issue.owner} />
                          <IssueDetail label="Created By" value={issue.created_by} />
                          <IssueDetail label="Updated" value={formatDate(issue.updated_at)} />
                          <IssueDetail label="Opened" value={formatDate(issue.opened_at)} />
                          <IssueDetail label="Closed" value={formatDate(issue.closed_at)} />
                          <IssueDetail label="Comments" value={issue.comment_count} />
                          <IssueDetail label="Attachments" value={issue.attachment_count} />
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
        <p>
          💡 <strong>Tip:</strong> The backend sync filters the ACC request for this site.
          Use Re-query ACC API after backend changes.
        </p>
      </div>
    </div>
  );
}

function IssueDetail({ label, value }) {
  const displayValue = value === 0 ? "0" : value || "N/A";

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ color: "#6c757d", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ color: "#212529", fontSize: "13px", overflowWrap: "anywhere" }}>
        {displayValue}
      </div>
    </div>
  );
}

const filterLabelStyle = {
  display: "block",
  marginBottom: "5px",
  fontSize: "13px",
  fontWeight: "bold",
  color: "#a0a0a0"
};

const filterInputStyle = {
  width: "100%",
  padding: "8px",
  border: "1px solid #ced4da",
  borderRadius: "4px",
  fontSize: "13px",
  color: "#212529",
  backgroundColor: "#fff"
};

const tableHeaderStyle = {
  padding: "12px",
  textAlign: "left",
  fontWeight: "bold",
  borderBottom: "2px solid #dee2e6",
  fontSize: "14px",
  color: "#212529"
};

const tableCellStyle = {
  padding: "12px",
  fontSize: "13px",
  color: "#212529"
};

const getStatusStyle = (status) => {
  const baseStyle = {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold"
  };

  const statusColors = {
    open: { backgroundColor: "#d1ecf1", color: "#0c5460" },
    closed: { backgroundColor: "#d4edda", color: "#155724" },
    completed: { backgroundColor: "#d4edda", color: "#155724" },
    in_progress: { backgroundColor: "#fff3cd", color: "#856404" },
    pending: { backgroundColor: "#f8d7da", color: "#721c24" }
  };

  return {
    ...baseStyle,
    ...(statusColors[status?.toLowerCase()] || { backgroundColor: "#e9ecef", color: "#495057" })
  };
};

const statusFilterGroupStyle = {
  minWidth: "210px",
  position: "relative"
};

const statusDropdownStyle = {
  position: "relative"
};

const statusDropdownSummaryStyle = {
  padding: "8px",
  border: "1px solid #ced4da",
  borderRadius: "4px",
  backgroundColor: "#fff",
  color: "#212529",
  fontSize: "13px",
  cursor: "pointer",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
};

const statusCheckboxesStyle = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  zIndex: 20,
  display: "grid",
  gap: "8px",
  minWidth: "100%",
  padding: "10px",
  border: "1px solid #ced4da",
  borderRadius: "4px",
  backgroundColor: "#fff",
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)"
};

const statusCheckboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  color: "#212529",
  fontSize: "13px",
  whiteSpace: "nowrap",
  cursor: "pointer"
};

const issueDetailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px 20px"
};
