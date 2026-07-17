import React, { useState, useEffect } from "react";
import { useSite } from "../contexts/SiteContext";
import ImageViewer from "../components/viewer/ImageViewer";
import PinDialog from "../components/PinDialog";
import PdfPages from "../components/PdfPages";
import { useAdmin } from "../contexts/AdminContext";
import config from "../config";

const API_BASE_URL = config.apiBaseUrl;

function cleanUrl(value) {
  return String(value || "").split("?")[0].split("#")[0];
}

function isPdf(src) {
  return cleanUrl(src).toLowerCase().endsWith(".pdf");
}

function isExcel(src) {
  const clean = cleanUrl(src).toLowerCase();
  return clean.endsWith(".xlsx") || clean.endsWith(".xls");
}

function isImage(src) {
  const clean = cleanUrl(src).toLowerCase();
  return (
    clean.endsWith(".jpg") ||
    clean.endsWith(".jpeg") ||
    clean.endsWith(".png") ||
    clean.endsWith(".gif") ||
    clean.endsWith(".webp")
  );
}

function getFilenameFromPath(pathValue) {
  if (!pathValue) return "";

  const cleanPath = cleanUrl(pathValue).replace(/\\/g, "/");
  const parts = cleanPath.split("/");
  const filename = parts[parts.length - 1];

  try {
    return decodeURIComponent(filename);
  } catch {
    return filename;
  }
}

function buildScheduleFileUrl(schedule, currentSite) {
  const filename =
    schedule.filename ||
    getFilenameFromPath(schedule.path) ||
    getFilenameFromPath(schedule.filePath) ||
    getFilenameFromPath(schedule.url);

  if (!filename) {
    return "";
  }

  return `${API_BASE_URL}/schedules/file/${encodeURIComponent(filename)}?site=${encodeURIComponent(currentSite)}`;
}

export default function Schedules() {
  const { currentSite } = useSite();
  const { isAdmin, adminPin } = useAdmin();
  const [schedules, setSchedules] = useState([]);
  const [activeFrameId, setActiveFrameId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    if (currentSite) {
      fetchSchedules();
    }
  }, [currentSite]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/schedules?site=${encodeURIComponent(currentSite)}`, { credentials: "include" });
      const data = await response.json();

      if (data.success) {
        const frames = data.schedules.map((schedule) => {
          const fileUrl = buildScheduleFileUrl(schedule, currentSite);

          return {
            id: schedule.id,
            label: schedule.label,
            image: fileUrl,
            fileUrl,
            fileName:
              schedule.filename ||
              getFilenameFromPath(schedule.path) ||
              getFilenameFromPath(schedule.filePath) ||
              schedule.label,
            isStarred: schedule.isStarred
          };
        });

        setSchedules(frames);

        if (data.defaultScheduleId && frames.some((frame) => frame.id === data.defaultScheduleId)) {
          setActiveFrameId(data.defaultScheduleId);
        } else if (frames.length > 0) {
          setActiveFrameId(frames[0].id);
        } else {
          setActiveFrameId(null);
        }
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    const input = document.getElementById("schedule-file-input");

    if (input) {
      input.click();
    }
  };

  const handleFileSelected = (event) => {
    const file = event.target.files[0];

    if (file) {
      setUploadFile(file);
      setShowPinDialog(true);
    }

    event.target.value = "";
  };

  const handlePinSubmit = async (pin) => {
    if (uploadFile) {
      await uploadSchedule(pin);
    }

    setShowPinDialog(false);
    setUploadFile(null);
  };

  const uploadSchedule = async (pin) => {
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await fetch(`${API_BASE_URL}/schedules/upload?site=${encodeURIComponent(currentSite)}`, {
        method: "POST",
        credentials: "include",
        headers: { "x-admin-pin": pin },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert("Schedule uploaded successfully!");
        fetchSchedules();
      } else {
        alert("Failed to upload schedule: " + data.error);
      }
    } catch (error) {
      console.error("Error uploading schedule:", error);
      alert("Error uploading schedule");
    }
  };

  const openActiveSchedule = () => {
    const activeFrame = schedules.find((frame) => frame.id === activeFrameId) || schedules[0];

    if (activeFrame?.fileUrl) {
      window.open(activeFrame.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  const deleteActiveSchedule = async () => {
    const active = schedules.find((frame) => frame.id === activeFrameId) || schedules[0];
    if (!active || !isAdmin || !adminPin) return;

    if (!window.confirm(`Delete ${active.label || "this schedule"}?\n\nThis cannot be undone.`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/schedules/${active.id}?site=${encodeURIComponent(currentSite)}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "x-admin-pin": adminPin }
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete schedule");
      }

      await fetchSchedules();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      window.alert(error.message);
    }
  };

  const activeFrame = schedules.find((frame) => frame.id === activeFrameId) || schedules[0];

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ color: "#a0a0a0" }}>Loading schedules...</p>
      </div>
    );
  }

  return (
    <div className="page-shell" style={{ padding: "10px 16px 16px" }}>
      <div style={{ marginBottom: "10px" }}>
        <h1 style={{ fontSize: "22px", margin: "0 0 3px" }}>Schedules</h1>
        <p style={{ color: "#a0a0a0", fontSize: "12px", margin: 0 }}>
          View project schedules and timeline documents
        </p>
      </div>

      <div style={{ marginBottom: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <input
          type="file"
          id="schedule-file-input"
          accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
          style={{ display: "none" }}
          onChange={handleFileSelected}
        />

        <button
          onClick={handleUploadClick}
          style={{
            padding: "7px 14px",
            backgroundColor: "#0696D7",
            border: "none",
            borderRadius: "4px",
            color: "#fff",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "500",
            transition: "all 0.2s"
          }}
          onMouseEnter={(event) => {
            event.target.style.backgroundColor = "#0582BE";
          }}
          onMouseLeave={(event) => {
            event.target.style.backgroundColor = "#0696D7";
          }}
        >
          Upload New Schedule
        </button>

        {activeFrame && (
          <button
            onClick={openActiveSchedule}
            style={{
              padding: "7px 14px",
              backgroundColor: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "4px",
              color: "#fff",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500"
            }}
          >
            Open Selected Schedule
          </button>
        )}

        {activeFrame && isAdmin && (
          <button
            type="button"
            onClick={deleteActiveSchedule}
            style={{
              padding: "7px 14px",
              backgroundColor: "#8b2d2d",
              border: "1px solid #c05a5a",
              borderRadius: "4px",
              color: "#fff",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600
            }}
          >
            Delete Schedule
          </button>
        )}
      </div>

      {schedules.length === 0 ? (
        <div
          style={{
            backgroundColor: "#1e1e1e",
            border: "1px solid #333",
            borderRadius: "8px",
            padding: "40px",
            textAlign: "center"
          }}
        >
          <p style={{ color: "#a0a0a0" }}>No schedules available. Upload one to get started.</p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "none",
              backgroundColor: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px"
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
              {schedules.map((frame) => (
                <div key={frame.id} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button
                    onClick={() => setActiveFrameId(frame.id)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: activeFrameId === frame.id ? "#0696D7" : "#2a2a2a",
                      border: "1px solid",
                      borderColor: activeFrameId === frame.id ? "#0696D7" : "#444",
                      borderRadius: "4px",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "14px",
                      transition: "all 0.2s"
                    }}
                  >
                    {frame.label}
                  </button>

                  <button
                    title="Set as default"
                    style={{
                      padding: "8px",
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "18px",
                      transition: "all 0.2s"
                    }}
                  >
                    {frame.isStarred ? "⭐" : "☆"}
                  </button>

                  <button
                    title="Delete schedule"
                    style={{
                      padding: "8px",
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#ff4444",
                      cursor: "pointer",
                      fontSize: "18px",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(event) => {
                      event.target.style.color = "#ff6666";
                    }}
                    onMouseLeave={(event) => {
                      event.target.style.color = "#ff4444";
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          {activeFrame && (
            <div
              style={{
                backgroundColor: "#1e1e1e",
                border: "1px solid #333",
                borderRadius: "8px",
                overflow: "hidden"
              }}
            >
              {isPdf(activeFrame.fileUrl) ? (
                <PdfPages src={activeFrame.fileUrl} title={activeFrame.label} />
              ) : isExcel(activeFrame.fileUrl) ? (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    minHeight: "300px"
                  }}
                >
                  <h2 style={{ marginBottom: "12px" }}>Excel Schedule</h2>
                  <p style={{ color: "#a0a0a0", marginBottom: "20px" }}>
                    Excel files cannot be previewed directly in the browser. Open it to view or download the full schedule.
                  </p>
                  <button
                    onClick={openActiveSchedule}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#0696D7",
                      border: "none",
                      borderRadius: "4px",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500"
                    }}
                  >
                    Open Excel Schedule
                  </button>
                </div>
              ) : isImage(activeFrame.fileUrl) ? (
                <ImageViewer imageSrc={activeFrame.fileUrl} markers={[]} />
              ) : (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    minHeight: "300px"
                  }}
                >
                  <h2 style={{ marginBottom: "12px" }}>Schedule File</h2>
                  <p style={{ color: "#a0a0a0", marginBottom: "20px" }}>
                    This file type cannot be previewed directly.
                  </p>
                  <button
                    onClick={openActiveSchedule}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#0696D7",
                      border: "none",
                      borderRadius: "4px",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500"
                    }}
                  >
                    Open Schedule
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <PinDialog
        isOpen={showPinDialog}
        onClose={() => {
          setShowPinDialog(false);
          setUploadFile(null);
        }}
        onSubmit={handlePinSubmit}
        title="Upload Schedule - Enter PIN"
      />
    </div>
  );
}
