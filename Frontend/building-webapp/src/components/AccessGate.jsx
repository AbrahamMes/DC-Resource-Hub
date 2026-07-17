import { useState } from "react";
import { useAccess } from "../contexts/AccessContext";

export default function AccessGate({ children }) {
  const { loading, unlocked, configured, unlock } = useAccess();
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!pin) return;

    try {
      setSubmitting(true);
      setError("");
      await unlock(pin);
      setPin("");
    } catch (unlockError) {
      let message = unlockError.message;
      if (Number.isFinite(unlockError.attemptsRemaining)) {
        message += ` (${unlockError.attemptsRemaining} attempts remaining)`;
      }
      setError(message);
      setPin("");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div style={screenStyle}><p style={{ color: "#a0a0a0" }}>Checking website access...</p></div>;
  }

  if (unlocked) return children;

  return (
    <div style={screenStyle}>
      <div style={cardStyle}>
        <div style={markStyle}>PC</div>
        <h1 style={{ margin: "0 0 8px", fontSize: "26px" }}>Project Resources</h1>
        <p style={{ margin: "0 0 24px", color: "#a0a0a0", fontSize: "14px" }}>
          Enter the website access PIN to continue.
        </p>

        {!configured && (
          <div style={configurationErrorStyle}>
            The backend administrator must configure SITE_ACCESS_PIN before this website can be unlocked.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="site-access-pin" style={labelStyle}>Website PIN</label>
          <input
            id="site-access-pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            autoFocus
            value={pin}
            disabled={submitting || !configured}
            onChange={(event) => setPin(event.target.value)}
            style={inputStyle}
          />

          {error && <div role="alert" style={errorStyle}>{error}</div>}

          <button
            type="submit"
            disabled={submitting || !pin || !configured}
            style={{ ...buttonStyle, opacity: submitting || !pin || !configured ? 0.6 : 1 }}
          >
            {submitting ? "Checking..." : "Unlock Website"}
          </button>
        </form>
      </div>
    </div>
  );
}

const screenStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "20px",
  boxSizing: "border-box",
  background: "radial-gradient(circle at top, #18394a 0, #121212 45%)"
};

const cardStyle = {
  width: "min(400px, 100%)",
  padding: "32px",
  boxSizing: "border-box",
  textAlign: "center",
  background: "#1e1e1e",
  border: "1px solid #3a3a3a",
  borderRadius: "14px",
  boxShadow: "0 24px 70px rgba(0,0,0,0.45)"
};

const markStyle = {
  width: "54px",
  height: "54px",
  margin: "0 auto 18px",
  display: "grid",
  placeItems: "center",
  borderRadius: "14px",
  color: "#fff",
  fontWeight: 800,
  background: "linear-gradient(135deg, #0b9cdd, #087fba)"
};

const labelStyle = { display: "block", marginBottom: "7px", color: "#c8c8c8", textAlign: "left", fontSize: "13px", fontWeight: 600 };
const inputStyle = { width: "100%", boxSizing: "border-box", padding: "12px", color: "#fff", background: "#121212", border: "1px solid #4a4a4a", borderRadius: "7px", fontSize: "18px", textAlign: "center", letterSpacing: "4px" };
const buttonStyle = { width: "100%", marginTop: "16px", padding: "12px", color: "#fff", background: "#0696d7", border: 0, borderRadius: "7px", fontWeight: 700 };
const errorStyle = { marginTop: "12px", color: "#ff9a9a", fontSize: "13px" };
const configurationErrorStyle = { marginBottom: "16px", padding: "10px", color: "#721c24", background: "#f8d7da", borderRadius: "6px", fontSize: "13px" };

