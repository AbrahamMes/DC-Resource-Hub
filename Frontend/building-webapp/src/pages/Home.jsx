import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSite } from "../contexts/SiteContext";
import config from "../config";

const API_BASE_URL = config.apiBaseUrl;

export default function Home() {
  const navigate = useNavigate();
  const { currentSite, availableSites } = useSite();

  const [issues, setIssues] = useState([]);
  const [assets, setAssets] = useState([]);

  const [issueStats, setIssueStats] = useState({
    total: null,
    lastSync: null
  });

  const [assetStats, setAssetStats] = useState({
    total: null,
    lastSync: null
  });

  const [contactStats, setContactStats] = useState({
    total: null
  });

  const [scheduleStats, setScheduleStats] = useState({
    total: null
  });

  const currentSiteName =
    availableSites.find((site) => site.id === currentSite)?.name || "Configured site";

  useEffect(() => {
    if (currentSite) {
      refreshDashboard();
    }
  }, [currentSite]);

  async function refreshDashboard() {
    await Promise.all([
      fetchIssueStats(),
      fetchIssues(),
      fetchAssetStats(),
      fetchAssets(),
      fetchContactStats(),
      fetchScheduleStats()
    ]);
  }

  async function fetchIssueStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/issues/sync-status?site=${currentSite}`, {
        credentials: "include"
      });

      const data = await response.json();

      if (data.success) {
        setIssueStats({
          total: data.total_issues ?? null,
          lastSync: data.last_sync ?? null
        });
      }
    } catch (error) {
      console.error("Error loading issue stats:", error);
    }
  }

  async function fetchIssues() {
    try {
      const response = await fetch(`${API_BASE_URL}/issues?site=${currentSite}`, {
        credentials: "include"
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.issues)) {
        setIssues(data.issues);
      }
    } catch (error) {
      console.error("Error loading issues:", error);
    }
  }

  async function fetchAssetStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/sync-status?site=${currentSite}`, {
        credentials: "include"
      });

      const data = await response.json();

      if (data.success) {
        setAssetStats({
          total: data.total_assets ?? null,
          lastSync: data.last_sync ?? null
        });
      }
    } catch (error) {
      console.error("Error loading asset stats:", error);
    }
  }

  async function fetchAssets() {
    try {
      const response = await fetch(`${API_BASE_URL}/assets?site=${currentSite}`, {
        credentials: "include"
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.assets)) {
        setAssets(data.assets);
      }
    } catch (error) {
      console.error("Error loading assets:", error);
    }
  }

  async function fetchContactStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts?site=${currentSite}`, {
        credentials: "include"
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.contacts)) {
        setContactStats({
          total: data.contacts.length
        });
      }
    } catch (error) {
      console.error("Error loading contact stats:", error);
    }
  }

  async function fetchScheduleStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/schedules?site=${currentSite}`, {
        credentials: "include"
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.schedules)) {
        setScheduleStats({
          total: data.schedules.length
        });
      }
    } catch (error) {
      console.error("Error loading schedule stats:", error);
    }
  }

  const computedIssueStats = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    let open = 0;
    let overdue = 0;
    let dueThisWeek = 0;

    for (const issue of issues) {
      const status = String(issue.status || "").toLowerCase();
      const isClosed = status.includes("closed") || status.includes("completed");

      if (!isClosed) {
        open += 1;
      }

      if (issue.due_date && !isClosed) {
        const dueDate = new Date(issue.due_date);

        if (!Number.isNaN(dueDate.getTime())) {
          if (dueDate < now) {
            overdue += 1;
          }

          if (dueDate >= now && dueDate <= sevenDaysFromNow) {
            dueThisWeek += 1;
          }
        }
      }
    }

    return {
      open,
      overdue,
      dueThisWeek
    };
  }, [issues]);

  const overdueIssueList = useMemo(() => {
    const now = new Date();

    return issues
      .filter((issue) => {
        const status = String(issue.status || "").toLowerCase();
        const isClosed = status.includes("closed") || status.includes("completed");

        if (!issue.due_date || isClosed) {
          return false;
        }

        const dueDate = new Date(issue.due_date);
        return !Number.isNaN(dueDate.getTime()) && dueDate < now;
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 2);
  }, [issues]);

  const nextDueIssues = useMemo(() => {
    const now = new Date();

    const upcomingIssues = issues
      .filter((issue) => {
        const status = String(issue.status || "").toLowerCase();
        const isClosed = status.includes("closed") || status.includes("completed");

        if (!issue.due_date || isClosed) {
          return false;
        }

        const dueDate = new Date(issue.due_date);
        return !Number.isNaN(dueDate.getTime()) && dueDate >= now;
      })
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    if (upcomingIssues.length === 0) {
      return [];
    }

    const nextDueDate = new Date(upcomingIssues[0].due_date).toDateString();

    return upcomingIssues.filter((issue) =>
      new Date(issue.due_date).toDateString() === nextDueDate
    );
  }, [issues]);

  const topAssetStatuses = useMemo(() => {
    const statusCounts = new Map();

    for (const asset of assets) {
      const status =
        asset.status ||
        asset.asset_status ||
        asset.assetStatus ||
        asset.current_status ||
        "No Status";

      const cleanStatus = String(status || "No Status").trim() || "No Status";
      statusCounts.set(cleanStatus, (statusCounts.get(cleanStatus) || 0) + 1);
    }

    return Array.from(statusCounts.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 2);
  }, [assets]);

  const latestSyncDate = issueStats.lastSync || assetStats.lastSync;

  function openOverdueIssues() {
    navigate("/issues?filter=overdue");
  }

  function formatDate(dateString) {
    if (!dateString) return "Not synced yet";

    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return dateString;
    }
  }

  function formatTimeNow() {
    return new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  return (
    <div className="dashboard-page" style={pageStyle}>
      <section className="dashboard-grid" style={dashboardGridStyle}>
        <DashboardCard
          eyebrow="Project Timeline"
          title="Schedules"
          icon="🗓️"
          description="View current project schedule documents."
          onClick={() => navigate("/schedules")}
        >
          <div style={metricMainStyle}>
            {scheduleStats.total === null ? "—" : scheduleStats.total}
          </div>
          <div style={metricLabelStyle}>
            {scheduleStats.total === 1 ? "Schedule Available" : "Schedules Available"}
          </div>

          <div style={schedulePreviewBoxStyle}>
            <div style={schedulePreviewIconStyle}>📄</div>
            <div>
              <div style={previewTitleStyle}>Current Schedule</div>
              <div style={previewTextStyle}>
                {scheduleStats.total === 0
                  ? "Not uploaded yet"
                  : "Tap to view uploaded schedules"}
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          eyebrow="ACC Tracking"
          title="Issues"
          icon="⚠️"
          description="Track Prime Controls open, overdue, and upcoming issues."
          onClick={() => navigate("/issues")}
          highlight={computedIssueStats.overdue > 0}
        >
          <div style={filterBadgeStyle}>Prime Controls Only</div>

          <div className="issue-metric-grid" style={issueMetricGridStyle}>
            <MiniMetric
              value={issueStats.total === null ? "—" : issueStats.total}
              label="Total"
            />
            <MiniMetric
              value={computedIssueStats.open}
              label="Open"
            />
            <MiniMetric
              value={computedIssueStats.overdue}
              label="Overdue"
              danger={computedIssueStats.overdue > 0}
            />
            <MiniMetric
              value={computedIssueStats.dueThisWeek}
              label="Due This Week"
            />
          </div>

          <div style={lastSyncTextStyle}>
            Last Sync: {formatDate(issueStats.lastSync)}
          </div>

          {nextDueIssues.length > 0 && (
            <div style={nextDueBoxStyle}>
              <span style={nextDueLabelStyle}>Next Due</span>
              <div style={nextDueItemsStyle}>
                {nextDueIssues.map((issue) => (
                  <span key={issue.id || issue.display_id} style={nextDueTextStyle}>
                    #{issue.display_id || "N/A"} — {formatDate(issue.due_date)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {computedIssueStats.overdue > 0 && (
          <div
            role="button"
            tabIndex={0}
            style={overdueBoxStyle}
            onClick={(event) => {
              event.stopPropagation();
              openOverdueIssues();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                openOverdueIssues();
              }
            }}
          >
            <div style={overdueHeaderStyle}>
              <span>Overdue Issues</span>
              <span style={overdueCountStyle}>{computedIssueStats.overdue}</span>
            </div>

            {overdueIssueList.length === 0 ? (
              <div style={noOverdueStyle}>No overdue issues right now.</div>
            ) : (
              <div style={overdueListStyle}>
                {overdueIssueList.map((issue) => (
                  <div key={issue.id || issue.display_id} style={overdueItemStyle}>
                    <div style={overdueIssueTitleStyle}>
                      #{issue.display_id || "N/A"} — {issue.title || "Untitled Issue"}
                    </div>
                    <div style={overdueDueDateStyle}>
                      Due: {formatDate(issue.due_date)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={tapHintStyle}>Tap to view all overdue issues</div>
          </div>
          )}
        </DashboardCard>

        <DashboardCard
          eyebrow="Equipment Tracking"
          title="Assets"
          icon="🏷️"
          description="Search synced ACC assets and equipment."
          onClick={() => navigate("/assets")}
        >
          <div style={metricMainStyle}>
            {assetStats.total === null ? "—" : assetStats.total}
          </div>
          <div style={metricLabelStyle}>Synced Assets</div>

          {topAssetStatuses.length > 0 ? (
            <div style={assetStatusBoxStyle}>
              <div style={assetStatusHeaderStyle}>Top Asset Status</div>
              <div style={assetStatusListStyle}>
                {topAssetStatuses.map((item) => (
                  <div key={item.status} style={assetStatusItemStyle}>
                    <span>{item.status}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={quickTextStyle}>
              Search by name, barcode, category, and status.
            </div>
          )}

          <div style={lastSyncTextStyle}>
            Last Sync: {formatDate(assetStats.lastSync)}
          </div>
        </DashboardCard>

        <DashboardCard
          eyebrow="Project Directory"
          title="Contacts"
          icon="📞"
          description="Find project team members quickly."
          onClick={() => navigate("/contacts")}
        >
          <div style={metricMainStyle}>
            {contactStats.total === null ? "—" : contactStats.total}
          </div>
          <div style={metricLabelStyle}>Project Contacts</div>

          <div style={quickActionListStyle}>
            <div style={quickActionStyle}>Search names</div>
            <div style={quickActionStyle}>Call numbers</div>
            <div style={quickActionStyle}>Open emails</div>
          </div>
        </DashboardCard>
      </section>

      {false && <section className="dashboard-secondary" style={secondarySectionStyle}>
        <SecondaryButton
          icon="📝"
          title="Commissioning"
          subtitle="Reports and entries"
          onClick={() => navigate("/commissioning-report")}
        />

        <SecondaryButton
          icon="📘"
          title="Bluebeam / Drawings"
          subtitle="Drawings, markups, and field links"
          onClick={() => navigate("/buildings")}
        />
      </section>}

      <div className="dashboard-status" style={footerStatusStyle}>
        <span>{currentSiteName}</span>
        <span>Site: {currentSite || "Unavailable"}</span>
        <span>Last Sync: {formatDate(latestSyncDate)}</span>
        <span>Local Time: {formatTimeNow()}</span>

        <button
          type="button"
          onClick={refreshDashboard}
          style={smallRefreshButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#0582BE";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#0696D7";
          }}
        >
          ↻ Refresh
        </button>
      </div>
    </div>
  );
}

function DashboardCard({ eyebrow, title, icon, description, children, onClick, highlight = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`dashboard-card dashboard-card--${title.toLowerCase().replaceAll(" ", "-")}`}
      style={{
        ...cardStyle,
        ...(highlight ? cardHighlightStyle : {})
      }}
      onMouseEnter={(e) => applyCardHover(e.currentTarget, highlight)}
      onMouseLeave={(e) => removeCardHover(e.currentTarget, highlight)}
    >
      <div style={cardTopStyle}>
        <div>
          <div style={eyebrowStyle}>{eyebrow}</div>
          <h2 style={cardTitleStyle}>{title}</h2>
        </div>

        <div style={cardIconStyle}>{icon}</div>
      </div>

      <p style={cardDescriptionStyle}>{description}</p>

      <div className="dashboard-card__content" style={cardContentStyle}>
        {children}
      </div>

      <div style={cardFooterStyle}>
        <span>Tap to open</span>
        <span style={openArrowStyle}>Open →</span>
      </div>
    </button>
  );
}

function MiniMetric({ value, label, danger = false }) {
  return (
    <div style={{
      ...miniMetricStyle,
      ...(danger ? miniMetricDangerStyle : {})
    }}>
      <div style={miniMetricValueStyle}>{value}</div>
      <div style={miniMetricLabelStyle}>{label}</div>
    </div>
  );
}

function SecondaryButton({ icon, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={secondaryButtonStyle}
      onMouseEnter={(e) => applySecondaryHover(e.currentTarget)}
      onMouseLeave={(e) => removeSecondaryHover(e.currentTarget)}
    >
      <span style={secondaryIconStyle}>{icon}</span>

      <span style={secondaryTextWrapStyle}>
        <span style={secondaryTitleStyle}>{title}</span>
        <span style={secondarySubtitleStyle}>{subtitle}</span>
      </span>

      <span style={secondaryArrowStyle}>Open →</span>
    </button>
  );
}

function applyCardHover(element, highlight) {
  element.style.transform = "translateY(-2px)";
  element.style.boxShadow = "0 14px 28px rgba(0, 0, 0, 0.4)";
  element.style.borderColor = highlight ? "#ff5c5c" : "#0696D7";
}

function removeCardHover(element, highlight) {
  element.style.transform = "translateY(0)";
  element.style.boxShadow = "0 6px 18px rgba(0, 0, 0, 0.25)";
  element.style.borderColor = highlight ? "rgba(255, 92, 92, 0.75)" : "#333";
}

function applySecondaryHover(element) {
  element.style.borderColor = "#0696D7";
  element.style.backgroundColor = "rgba(6, 150, 215, 0.18)";
}

function removeSecondaryHover(element) {
  element.style.borderColor = "#333";
  element.style.backgroundColor = "#1e1e1e";
}

const pageStyle = {
  height: "calc(100vh - 75px)",
  padding: "10px 14px",
  backgroundColor: "#121212",
  color: "#fff",
  boxSizing: "border-box",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  gap: "10px"
};

const dashboardGridStyle = {
  flex: "1 1 auto",
  minHeight: 0,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gridTemplateRows: "repeat(2, minmax(0, 1fr))",
  gap: "10px"
};

const cardStyle = {
  height: "100%",
  minHeight: 0,
  padding: "14px",
  backgroundColor: "#1e1e1e",
  color: "#fff",
  border: "1px solid #333",
  borderRadius: "16px",
  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.25)",
  cursor: "pointer",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  transition: "all 0.18s ease",
  boxSizing: "border-box",
  overflow: "hidden"
};

const cardHighlightStyle = {
  borderColor: "rgba(255, 92, 92, 0.75)"
};

const cardTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "10px"
};

const eyebrowStyle = {
  fontSize: "11px",
  color: "#8fcef0",
  textTransform: "uppercase",
  letterSpacing: "0.6px",
  fontWeight: 900,
  marginBottom: "4px"
};

const cardTitleStyle = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 900,
  letterSpacing: "-0.3px",
  lineHeight: 1
};

const cardIconStyle = {
  width: "44px",
  height: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "13px",
  backgroundColor: "#121212",
  border: "1px solid #333",
  fontSize: "24px",
  flexShrink: 0
};

const cardDescriptionStyle = {
  margin: "8px 0 10px 0",
  color: "#b8b8b8",
  fontSize: "13px",
  lineHeight: 1.25
};

const cardContentStyle = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  overflow: "hidden"
};

const cardFooterStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: "8px",
  paddingTop: "8px",
  borderTop: "1px solid #333",
  color: "#a0a0a0",
  fontSize: "12px",
  fontWeight: 800,
  flexShrink: 0
};

const openArrowStyle = {
  color: "#8fcef0",
  fontWeight: 900
};

const metricMainStyle = {
  fontSize: "42px",
  lineHeight: 1,
  fontWeight: 900,
  letterSpacing: "-1px"
};

const metricLabelStyle = {
  marginTop: "4px",
  color: "#a0a0a0",
  fontSize: "12px",
  fontWeight: 800
};

const filterBadgeStyle = {
  alignSelf: "flex-start",
  marginBottom: "8px",
  padding: "4px 8px",
  borderRadius: "999px",
  backgroundColor: "rgba(6, 150, 215, 0.16)",
  border: "1px solid rgba(143, 206, 240, 0.45)",
  color: "#8fcef0",
  fontSize: "10px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.4px"
};

const schedulePreviewBoxStyle = {
  marginTop: "14px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px",
  borderRadius: "12px",
  backgroundColor: "#121212",
  border: "1px solid #333"
};

const schedulePreviewIconStyle = {
  fontSize: "22px",
  flexShrink: 0
};

const previewTitleStyle = {
  fontSize: "13px",
  fontWeight: 900,
  marginBottom: "2px"
};

const previewTextStyle = {
  color: "#a0a0a0",
  fontSize: "11px"
};

const issueMetricGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "6px"
};

const miniMetricStyle = {
  padding: "8px 5px",
  borderRadius: "10px",
  backgroundColor: "#121212",
  border: "1px solid #333",
  textAlign: "center"
};

const miniMetricDangerStyle = {
  borderColor: "rgba(255, 92, 92, 0.7)",
  backgroundColor: "rgba(255, 92, 92, 0.12)"
};

const miniMetricValueStyle = {
  fontSize: "20px",
  fontWeight: 900,
  lineHeight: 1
};

const miniMetricLabelStyle = {
  marginTop: "4px",
  color: "#a0a0a0",
  fontSize: "9px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.2px",
  lineHeight: 1.1
};

const lastSyncTextStyle = {
  marginTop: "8px",
  color: "#a0a0a0",
  fontSize: "11px",
  fontWeight: 800
};

const nextDueBoxStyle = {
  marginTop: "8px",
  padding: "7px 9px",
  borderRadius: "10px",
  backgroundColor: "#121212",
  border: "1px solid #333",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px"
};

const nextDueLabelStyle = {
  color: "#8fcef0",
  fontSize: "10px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  flexShrink: 0
};

const nextDueTextStyle = {
  color: "#fff",
  fontSize: "11px",
  fontWeight: 900,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};

const nextDueItemsStyle = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
  textAlign: "right"
};

const overdueBoxStyle = {
  marginTop: "8px",
  padding: "9px",
  borderRadius: "12px",
  backgroundColor: "#121212",
  border: "1px solid rgba(255, 92, 92, 0.45)",
  cursor: "pointer",
  overflow: "hidden"
};

const overdueHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "6px",
  color: "#fff",
  fontSize: "12px",
  fontWeight: 900
};

const overdueCountStyle = {
  padding: "2px 7px",
  borderRadius: "999px",
  backgroundColor: "rgba(255, 92, 92, 0.18)",
  border: "1px solid rgba(255, 92, 92, 0.5)",
  color: "#ffb3b3",
  fontSize: "10px"
};

const overdueListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "5px"
};

const overdueItemStyle = {
  padding: "6px",
  borderRadius: "8px",
  backgroundColor: "#1c1c1c",
  border: "1px solid #333"
};

const overdueIssueTitleStyle = {
  color: "#fff",
  fontSize: "11px",
  fontWeight: 900,
  lineHeight: 1.15,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
};

const overdueDueDateStyle = {
  marginTop: "2px",
  color: "#ffb3b3",
  fontSize: "10px",
  fontWeight: 800
};

const noOverdueStyle = {
  color: "#a0a0a0",
  fontSize: "11px",
  fontWeight: 700
};

const tapHintStyle = {
  marginTop: "6px",
  color: "#8fcef0",
  fontSize: "10px",
  fontWeight: 900
};

const quickTextStyle = {
  marginTop: "14px",
  padding: "10px",
  borderRadius: "10px",
  backgroundColor: "#121212",
  border: "1px solid #333",
  color: "#a0a0a0",
  fontSize: "12px",
  fontWeight: 800
};

const assetStatusBoxStyle = {
  marginTop: "14px",
  padding: "10px",
  borderRadius: "10px",
  backgroundColor: "#121212",
  border: "1px solid #333"
};

const assetStatusHeaderStyle = {
  color: "#8fcef0",
  fontSize: "10px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  marginBottom: "7px"
};

const assetStatusListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px"
};

const assetStatusItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  color: "#fff",
  fontSize: "12px",
  fontWeight: 800
};

const quickActionListStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  marginTop: "14px"
};

const quickActionStyle = {
  padding: "7px 9px",
  borderRadius: "999px",
  backgroundColor: "#121212",
  border: "1px solid #333",
  color: "#a0a0a0",
  fontSize: "11px",
  fontWeight: 900
};

const secondarySectionStyle = {
  flex: "0 0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px"
};

const secondaryButtonStyle = {
  height: "58px",
  padding: "10px 14px",
  borderRadius: "14px",
  border: "1px solid #333",
  backgroundColor: "#1e1e1e",
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  textAlign: "left",
  transition: "all 0.18s ease",
  boxShadow: "0 5px 14px rgba(0,0,0,0.2)"
};

const secondaryIconStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  backgroundColor: "#121212",
  border: "1px solid #333",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  flexShrink: 0
};

const secondaryTextWrapStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  flex: 1,
  minWidth: 0
};

const secondaryTitleStyle = {
  display: "block",
  fontSize: "16px",
  fontWeight: 900,
  lineHeight: 1
};

const secondarySubtitleStyle = {
  display: "block",
  color: "#a0a0a0",
  fontSize: "11px",
  fontWeight: 700,
  lineHeight: 1.1
};

const secondaryArrowStyle = {
  color: "#8fcef0",
  fontSize: "12px",
  fontWeight: 900,
  whiteSpace: "nowrap"
};

const footerStatusStyle = {
  flex: "0 0 auto",
  minHeight: "34px",
  padding: "6px 8px 6px 12px",
  borderRadius: "10px",
  border: "1px solid #333",
  backgroundColor: "#1a1a1a",
  color: "#a0a0a0",
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
  alignItems: "center",
  gap: "10px",
  fontSize: "11px",
  fontWeight: 800,
  boxSizing: "border-box"
};

const smallRefreshButtonStyle = {
  padding: "6px 10px",
  border: "1px solid rgba(143, 206, 240, 0.55)",
  borderRadius: "8px",
  backgroundColor: "#0696D7",
  color: "#fff",
  fontSize: "11px",
  fontWeight: 900,
  cursor: "pointer",
  transition: "all 0.18s ease",
  whiteSpace: "nowrap"
};
