import React, { useEffect, useState } from "react";
import { useSite } from "../contexts/SiteContext";

export default function TopIssuesSlide() {
  const { currentSite } = useSite();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentSite) {
      fetchTopIssues();
    }
  }, [currentSite]);

  const fetchTopIssues = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/issues/top?site=${currentSite}&limit=3`);
      const data = await response.json();

      if (data.success) {
        setIssues(data.issues);
      } else {
        setError('Failed to load issues');
      }
    } catch (err) {
      console.error('Error fetching top issues:', err);
      setError('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPriorityColor = (priority) => {
    const priorityLower = (priority || '').toLowerCase();
    if (priorityLower.includes('high') || priorityLower.includes('critical')) return '#ff4444';
    if (priorityLower.includes('medium') || priorityLower.includes('normal')) return '#ffaa00';
    if (priorityLower.includes('low')) return '#44ff44';
    return '#0696D7';
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        color: '#a0a0a0'
      }}>
        Loading top issues...
      </div>
    );
  }

  if (error || issues.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: '40px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
        <h3 style={{ color: '#fff', marginBottom: '8px' }}>No Issues Found</h3>
        <p style={{ color: '#a0a0a0', textAlign: 'center' }}>
          {error || 'No open issues with due dates found. Sync issues from the Issues page.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: '40px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <h2 style={{
        fontSize: '32px',
        marginBottom: '24px',
        textAlign: 'center',
        color: '#fff'
      }}>
        Top 3 Issues by Due Date
      </h2>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%'
      }}>
        {issues.map((issue, index) => (
          <div
            key={issue.id}
            style={{
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start'
            }}
          >
            {/* Issue Number Badge */}
            <div style={{
              backgroundColor: getPriorityColor(issue.priority),
              color: '#000',
              fontWeight: 'bold',
              fontSize: '24px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {index + 1}
            </div>

            {/* Issue Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px',
                gap: '16px'
              }}>
                <h3 style={{
                  color: '#fff',
                  fontSize: '18px',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1
                }}>
                  {issue.title || 'Untitled Issue'}
                </h3>
                <div style={{
                  backgroundColor: 'rgba(6, 150, 215, 0.2)',
                  color: '#0696D7',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}>
                  Due: {formatDate(issue.due_date)}
                </div>
              </div>

              <p style={{
                color: '#a0a0a0',
                fontSize: '14px',
                margin: '0 0 12px 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {issue.description || 'No description available'}
              </p>

              <div style={{
                display: 'flex',
                gap: '16px',
                fontSize: '12px',
                color: '#888'
              }}>
                {issue.priority && (
                  <span>
                    <strong>Priority:</strong> {issue.priority}
                  </span>
                )}
                {issue.status && (
                  <span>
                    <strong>Status:</strong> {issue.status}
                  </span>
                )}
                {issue.assigned_to && (
                  <span>
                    <strong>Assigned:</strong> {issue.assigned_to}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
