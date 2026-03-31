import React, { useState, useEffect } from "react";
import { useSite } from "../contexts/SiteContext";
import FrameSelector from "../components/viewer/FrameSelector";
import ImageViewer from "../components/viewer/ImageViewer";
import PinDialog from "../components/PinDialog";

function isPdf(src) {
  return typeof src === "string" && src.toLowerCase().endsWith(".pdf");
}

export default function Schedules() {
  const { currentSite } = useSite();
  const [schedules, setSchedules] = useState([]);
  const [activeFrameId, setActiveFrameId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinAction, setPinAction] = useState(null); // 'upload' or 'delete'
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    if (currentSite) {
      fetchSchedules();
    }
  }, [currentSite]);

  const fetchSchedules = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/schedules?site=${currentSite}`);
      const data = await response.json();

      if (data.success) {
        const frames = data.schedules.map(s => ({
          id: s.id,
          label: s.label,
          image: `http://localhost:3001${s.path}`,
          isStarred: s.isStarred
        }));
        setSchedules(frames);

        // Set active frame to default or first schedule
        if (data.defaultScheduleId) {
          setActiveFrameId(data.defaultScheduleId);
        } else if (frames.length > 0) {
          setActiveFrameId(frames[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    document.getElementById('schedule-file-input').click();
  };

  const handleFileSelected = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setPinAction('upload');
      setShowPinDialog(true);
    }
  };

  const handleDeleteClick = (scheduleId) => {
    setScheduleToDelete(scheduleId);
    setPinAction('delete');
    setShowPinDialog(true);
  };

  const handlePinSubmit = async (pin) => {
    if (pinAction === 'upload' && uploadFile) {
      await uploadSchedule(pin);
    } else if (pinAction === 'delete' && scheduleToDelete) {
      await deleteSchedule(pin, scheduleToDelete);
    }
    setShowPinDialog(false);
    setPinAction(null);
    setUploadFile(null);
    setScheduleToDelete(null);
  };

  const uploadSchedule = async (pin) => {
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('pin', pin);

      const response = await fetch(`http://localhost:3001/api/schedules/upload?site=${currentSite}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('Schedule uploaded successfully!');
        fetchSchedules();
      } else {
        alert('Failed to upload schedule: ' + data.error);
      }
    } catch (error) {
      console.error('Error uploading schedule:', error);
      alert('Error uploading schedule');
    }
  };

  const deleteSchedule = async (pin, scheduleId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/schedules/${scheduleId}?site=${currentSite}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pin })
      });

      const data = await response.json();

      if (data.success) {
        alert('Schedule deleted successfully!');
        fetchSchedules();
      } else {
        alert('Failed to delete schedule: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Error deleting schedule');
    }
  };

  const handleStarSchedule = async (scheduleId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/schedules/${scheduleId}/star?site=${currentSite}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        fetchSchedules();
      } else {
        alert('Failed to star schedule: ' + data.error);
      }
    } catch (error) {
      console.error('Error starring schedule:', error);
      alert('Error starring schedule');
    }
  };

  const pdfUrlWithZoom = (src, zoom) => {
    if (!src) return src;
    // Only add zoom anchor if not already present
    if (src.includes('#')) return src;
    return `${src}#zoom=${zoom}`;
  };

  const activeFrame = schedules.find((f) => f.id === activeFrameId) || schedules[0];

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#a0a0a0' }}>Loading schedules...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Schedules</h1>
        <p style={{ color: '#a0a0a0', fontSize: '14px' }}>
          View project schedules and timeline documents
        </p>
      </div>

      {/* Upload Button */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="file"
          id="schedule-file-input"
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={handleFileSelected}
        />
        <button
          onClick={handleUploadClick}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0696D7',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0582BE'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#0696D7'}
        >
          Upload New Schedule
        </button>
      </div>

      {schedules.length === 0 ? (
        <div style={{
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#a0a0a0' }}>No schedules available. Upload one to get started.</p>
        </div>
      ) : (
        <>
          {/* Schedule Selector with Star and Delete */}
          <div style={{
            backgroundColor: '#1e1e1e',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {schedules.map((frame) => (
                <div key={frame.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => setActiveFrameId(frame.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: activeFrameId === frame.id ? '#0696D7' : '#2a2a2a',
                      border: '1px solid',
                      borderColor: activeFrameId === frame.id ? '#0696D7' : '#444',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {frame.label}
                  </button>

                  {/* Star Button */}
                  <button
                    onClick={() => handleStarSchedule(frame.id)}
                    title="Set as default"
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '18px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {frame.isStarred ? '⭐' : '☆'}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteClick(frame.id)}
                    title="Delete schedule"
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#ff4444',
                      cursor: 'pointer',
                      fontSize: '18px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#ff6666'}
                    onMouseLeave={(e) => e.target.style.color = '#ff4444'}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Viewer */}
          {activeFrame && (
            <div style={{
              backgroundColor: '#1e1e1e',
              border: '1px solid #333',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              {isPdf(activeFrame.image) ? (
                <div style={{ width: "100%", height: "80vh" }}>
                  <object
                    data={pdfUrlWithZoom(activeFrame.image, 200)}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                  >
                    <iframe
                      src={pdfUrlWithZoom(activeFrame.image, 200)}
                      title={activeFrame.label}
                      style={{ width: "100%", height: "100%", border: "none" }}
                    />
                  </object>
                </div>
              ) : (
                <ImageViewer imageSrc={activeFrame.image} markers={[]} />
              )}
            </div>
          )}
        </>
      )}

      {/* PIN Dialog */}
      <PinDialog
        isOpen={showPinDialog}
        onClose={() => {
          setShowPinDialog(false);
          setPinAction(null);
          setUploadFile(null);
          setScheduleToDelete(null);
        }}
        onSubmit={handlePinSubmit}
        title={pinAction === 'upload' ? 'Upload Schedule - Enter PIN' : 'Delete Schedule - Enter PIN'}
      />
    </div>
  );
}
