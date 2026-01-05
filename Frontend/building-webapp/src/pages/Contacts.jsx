import React, { useEffect, useMemo, useState } from "react";

const FALLBACK_CONTACTS = [
  { name: "Brennan Charley", company: "Prime Controls", email: "b.charley@prime-controls.com", phone: "(505) 205-4252", position: "Project Manager" },
  { name: "Abraham Mes", company: "Prime Controls", email: "a.mes@prime-controls.com", phone: "(208) 316-7271", position: "Project Engineer" },
];

function normalizeRow(row) {
  const get = (obj, candidates) => {
    const keys = Object.keys(obj || {});
    for (const cand of candidates) {
      const k = keys.find((kk) => kk.toLowerCase() === cand.toLowerCase());
      if (k) return obj[k] ?? "";
    }
    return "";
  };

  return {
    name: get(row, ["name", "full name", "contact name"]).toString(),
    company: get(row, ["company", "organization", "employer"]).toString(),
    email: get(row, ["email", "email address"]).toString(),
    phone: get(row, ["phone", "phone number", "telephone"]).toString(),
    position: get(row, ["position", "job title", "role"]).toString(),
    area: get(row, ["area", "area/equipment"]).toString(),
  };
}

export default function Contacts() {
  const [contacts, setContacts] = useState(FALLBACK_CONTACTS);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    position: '',
    area: ''
  });

  useEffect(() => {
    let cancelled = false;
    async function loadJson() {
      try {
        const res = await fetch("/src/data/contacts.json");
        if (!res.ok) throw new Error("contacts.json not found");
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length) {
          const parsed = raw.map((r) => normalizeRow(r));
          if (!cancelled) setContacts(parsed);
        }
      } catch (e) {
        // keep fallback contacts
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadJson();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      [c.name, c.company, c.email, c.phone, c.position, c.area].join(" ").toLowerCase().includes(q)
    );
  }, [query, contacts]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }

    // Add new contact to the list
    setContacts(prev => [...prev, { ...formData }]);

    // Reset form and close modal
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      position: '',
      area: ''
    });
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      position: '',
      area: ''
    });
    setShowAddForm(false);
  };

  const thStyle = {
    textAlign: "left",
    padding: "12px 16px",
    borderBottom: "2px solid #333",
    fontWeight: 600,
    color: '#a0a0a0',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const tdStyle = {
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    fontSize: '14px'
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Contacts</h1>
          <p style={{ color: '#a0a0a0', fontSize: '14px' }}>
            Find contact information for project team members
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0696D7',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0580bd'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#0696D7'}
        >
          + Add Contact
        </button>
      </div>

      <div style={{
        backgroundColor: '#1e1e1e',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: 600,
          fontSize: '13px',
          color: '#a0a0a0'
        }}>
          Search Contacts
        </label>
        <input
          aria-label="Filter contacts"
          placeholder="Search name, company, email, phone, position, or area..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '98%',
            padding: '10px 12px',
            fontSize: '14px',
            backgroundColor: '#121212',
            border: '1px solid #333',
            borderRadius: '4px',
            color: '#fff',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = '#0696D7'}
          onBlur={(e) => e.target.style.borderColor = '#333'}
        />
        {loading && <span style={{ display: 'block', marginTop: 8, fontSize: '13px', color: '#a0a0a0' }}>Loading contacts…</span>}
      </div>

      <div style={{
        backgroundColor: '#1e1e1e',
        border: '1px solid #333',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '8px', color: '#fff' }}>No contacts found</h3>
            <p style={{ color: '#a0a0a0', fontSize: '14px' }}>
              {query ? 'Try adjusting your search criteria' : 'No contacts available'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: '#121212' }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Company</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Position</th>
                  <th style={thStyle}>Area/Equipment</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr
                    key={i}
                    style={{ transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#252525'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={tdStyle}>{c.name}</td>
                    <td style={tdStyle}>{c.company}</td>
                    <td style={tdStyle}>
                      {c.email ? (
                        <a
                          href={`mailto:${c.email}`}
                          style={{
                            color: '#0696D7',
                            textDecoration: 'none'
                          }}
                          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                          {c.email}
                        </a>
                      ) : '-'}
                    </td>
                    <td style={tdStyle}>
                      {c.phone ? (
                        <a
                          href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}
                          style={{
                            color: '#0696D7',
                            textDecoration: 'none'
                          }}
                          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                          {c.phone}
                        </a>
                      ) : '-'}
                    </td>
                    <td style={tdStyle}>{c.position || '-'}</td>
                    <td style={tdStyle}>{c.area || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p style={{
          marginTop: '16px',
          fontSize: '13px',
          color: '#a0a0a0',
          textAlign: 'center'
        }}>
          Showing {filtered.length} of {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Add Contact Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(107, 107, 107, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#464646ff',
            border: '2px solid #000000ff',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#fff' }}>Add New Contact</h2>

            <form onSubmit={handleSubmit}>
              {/* Name (Required) */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#a0a0a0'
                }}>
                  Name <span style={{ color: '#0696D7' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter full name"
                  style={{
                    width: '95%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    color: '#212529',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0696D7'}
                  onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                />
              </div>

              {/* Company (Optional) */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#a0a0a0'
                }}>
                  Company <span style={{ color: '#666', fontSize: '12px' }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                  style={{
                    width: '95%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    color: '#212529',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0696D7'}
                  onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                />
              </div>

              {/* Email (Optional) */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#a0a0a0'
                }}>
                  Email <span style={{ color: '#666', fontSize: '12px' }}>(Optional)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  style={{
                    width: '95%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    color: '#212529',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0696D7'}
                  onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                />
              </div>

              {/* Phone (Optional) */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#a0a0a0'
                }}>
                  Phone <span style={{ color: '#666', fontSize: '12px' }}>(Optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  style={{
                    width: '95%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    color: '#212529',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0696D7'}
                  onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                />
              </div>

              {/* Position (Optional) */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#a0a0a0'
                }}>
                  Position <span style={{ color: '#666', fontSize: '12px' }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="Enter job position"
                  style={{
                    width: '95%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    color: '#212529',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0696D7'}
                  onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                />
              </div>

              {/* Area/Equipment (Optional) */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#a0a0a0'
                }}>
                  Area/Equipment <span style={{ color: '#666', fontSize: '12px' }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  placeholder="Enter area or equipment"
                  style={{
                    width: '95%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    color: '#212529',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0696D7'}
                  onBlur={(e) => e.target.style.borderColor = '#ced4da'}
                />
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#333',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#333'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#0696D7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#0580bd'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#0696D7'}
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
