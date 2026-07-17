import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSite } from "../contexts/SiteContext";
import config from "../config";
import { useAdmin } from "../contexts/AdminContext";

const API_BASE_URL = config.apiBaseUrl;
const PRIME_CONTROLS = "Prime Controls";
const NO_COMPANY = "__NO_COMPANY__";

const companyOptionStyle = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  padding: "7px 8px",
  borderRadius: "4px",
  color: "#fff",
  cursor: "pointer",
  fontSize: "12px"
};

const FALLBACK_CONTACTS = [
  {
    id: "fallback-1",
    name: "Brennan Charley",
    company: "Prime Controls",
    email: "b.charley@prime-controls.com",
    phone: "(505) 205-4252",
    position: "Project Manager",
    area: ""
  },
  {
    id: "fallback-2",
    name: "Abraham Mes",
    company: "Prime Controls",
    email: "a.mes@prime-controls.com",
    phone: "(208) 316-7271",
    position: "Project Engineer",
    area: ""
  }
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
    id: get(row, ["id"]).toString() || `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: get(row, ["name", "full name", "contact name"]).toString(),
    company: get(row, ["company", "organization", "employer"]).toString(),
    email: get(row, ["email", "email address"]).toString(),
    phone: get(row, ["phone", "phone number", "telephone"]).toString(),
    position: get(row, ["position", "job title", "role"]).toString(),
    area: get(row, ["area", "area/equipment"]).toString()
  };
}

const emptyForm = {
  id: "",
  name: "",
  company: "",
  email: "",
  phone: "",
  position: "",
  area: ""
};

export default function Contacts() {
  const { currentSite } = useSite();
  const { isAdmin, adminPin } = useAdmin();

  const [contacts, setContacts] = useState(FALLBACK_CONTACTS);
  const [query, setQuery] = useState("");
  const [selectedCompanies, setSelectedCompanies] = useState(new Set());
  const [companyFilterOpen, setCompanyFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formData, setFormData] = useState(emptyForm);
  const companyFilterRef = useRef(null);

  useEffect(() => {
    if (currentSite) {
      setCompanyFilterOpen(false);
      loadContacts();
    }
  }, [currentSite]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (companyFilterRef.current && !companyFilterRef.current.contains(event.target)) {
        setCompanyFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const companies = useMemo(() => {
    const uniqueCompanies = new Map();

    contacts.forEach((contact) => {
      const company = contact.company.trim();
      const key = company ? company.toLocaleLowerCase() : NO_COMPANY;
      if (!uniqueCompanies.has(key)) {
        uniqueCompanies.set(key, company || NO_COMPANY);
      }
    });

    return [...uniqueCompanies.values()].sort((a, b) => {
      if (a === NO_COMPANY) return 1;
      if (b === NO_COMPANY) return -1;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
  }, [contacts]);

  function setContactsAndSyncCompanies(nextContacts, resetSelection = false) {
    setContacts(nextContacts);

    const nextCompanies = [...new Map(nextContacts.map((contact) => {
      const company = contact.company.trim();
      const value = company || NO_COMPANY;
      return [company ? company.toLocaleLowerCase() : NO_COMPANY, value];
    })).values()];

    setSelectedCompanies((previous) => {
      if (resetSelection) {
        return new Set(nextCompanies.filter(
          (company) => company.toLocaleLowerCase() !== PRIME_CONTROLS.toLocaleLowerCase()
        ));
      }

      const stillAvailable = new Set(
        [...previous].filter((company) => nextCompanies.includes(company))
      );
      nextCompanies.forEach((company) => {
        if (!companies.includes(company)) stillAvailable.add(company);
      });
      return stillAvailable;
    });
  }

  async function loadContacts() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/contacts?site=${currentSite}`, {
        credentials: "include"
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.contacts)) {
        setContactsAndSyncCompanies(data.contacts.map((contact) => normalizeRow(contact)), true);
      } else {
        throw new Error(data.error || "Failed to load contacts");
      }
    } catch (err) {
      console.error("Error loading contacts:", err);
      setError(err.message);
      setContactsAndSyncCompanies(FALLBACK_CONTACTS, true);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return contacts.filter((c) => {
      const company = c.company.trim() || NO_COMPANY;
      const matchesCompany = selectedCompanies.has(company);
      const matchesSearch = !q || [c.name, c.company, c.email, c.phone, c.position, c.area]
        .join(" ")
        .toLowerCase()
        .includes(q);

      return matchesCompany && matchesSearch;
    });
  }, [query, contacts, selectedCompanies]);

  function toggleCompany(company) {
    setSelectedCompanies((previous) => {
      const next = new Set(previous);
      if (next.has(company)) next.delete(company);
      else next.add(company);
      return next;
    });
  }

  function toggleAllCompanies() {
    setSelectedCompanies((previous) =>
      previous.size === companies.length ? new Set() : new Set(companies)
    );
  }

  function handleInputChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function openAddForm() {
    setFormMode("add");
    setFormData(emptyForm);
    setShowForm(true);
  }

  function openEditForm(contact) {
    setFormMode("edit");
    setFormData({
      id: contact.id,
      name: contact.name || "",
      company: contact.company || "",
      email: contact.email || "",
      phone: contact.phone || "",
      position: contact.position || "",
      area: contact.area || ""
    });
    setShowForm(true);
  }

  function closeForm() {
    setFormData(emptyForm);
    setShowForm(false);
    setFormMode("add");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Name is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage("");

      const isEdit = formMode === "edit";
      const url = isEdit
        ? `${API_BASE_URL}/contacts/${encodeURIComponent(formData.id)}?site=${currentSite}`
        : `${API_BASE_URL}/contacts?site=${currentSite}`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save contact");
      }

      if (Array.isArray(data.contacts)) {
        setContactsAndSyncCompanies(data.contacts.map((contact) => normalizeRow(contact)));
      } else {
        await loadContacts();
      }

      closeForm();
      setSuccessMessage(isEdit ? "Contact updated successfully." : "Contact saved successfully.");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error saving contact:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(contact) {
    if (!adminPin) {
      setError("Enable admin mode before deleting contacts.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${contact.name || "this contact"}?\n\nThis cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage("");

      const response = await fetch(
        `${API_BASE_URL}/contacts/${encodeURIComponent(contact.id)}?site=${currentSite}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "x-admin-pin": adminPin
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete contact");
      }

      if (Array.isArray(data.contacts)) {
        setContactsAndSyncCompanies(data.contacts.map((savedContact) => normalizeRow(savedContact)));
      } else {
        await loadContacts();
      }

      setSuccessMessage("Contact deleted successfully.");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error deleting contact:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const thStyle = {
    textAlign: "left",
    padding: "12px 16px",
    borderBottom: "2px solid #333",
    fontWeight: 600,
    color: "#a0a0a0",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  };

  const tdStyle = {
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    fontSize: "14px"
  };

  const inputStyle = {
    width: "95%",
    padding: "10px 12px",
    fontSize: "14px",
    backgroundColor: "#fff",
    border: "1px solid #ced4da",
    borderRadius: "4px",
    color: "#212529",
    outline: "none"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#a0a0a0"
  };

  const smallActionButtonStyle = {
    padding: "5px 8px",
    borderRadius: "4px",
    border: "1px solid #444",
    backgroundColor: "#2a2a2a",
    color: "#fff",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 700,
    marginRight: "6px"
  };

  return (
    <div className="page-shell data-page" style={{ padding: "10px 16px 16px" }}>
      <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "22px", margin: "0 0 3px" }}>Contacts</h1>
          <p style={{ color: "#a0a0a0", fontSize: "12px", margin: 0 }}>
            Find, save, and edit project team contacts
          </p>
        </div>

        <button
          onClick={openAddForm}
          style={{
            padding: "7px 14px",
            backgroundColor: "#0696D7",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = "#0580bd"}
          onMouseLeave={(e) => e.target.style.backgroundColor = "#0696D7"}
        >
          + Add Contact
        </button>
      </div>

      {successMessage && (
        <div style={{
          marginBottom: "16px",
          padding: "10px 12px",
          backgroundColor: "#d4edda",
          borderRadius: "6px",
          color: "#155724",
          fontSize: "14px",
          fontWeight: 600
        }}>
          ✅ {successMessage}
        </div>
      )}

      {error && (
        <div style={{
          marginBottom: "16px",
          padding: "10px 12px",
          backgroundColor: "#f8d7da",
          borderRadius: "6px",
          color: "#721c24",
          fontSize: "14px",
          fontWeight: 600
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{
        backgroundColor: "#1e1e1e",
        border: "1px solid #333",
        borderRadius: "8px",
        padding: "9px 10px",
        marginBottom: "10px"
      }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 360px" }}>
            <label style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: 600,
              fontSize: "11px",
              color: "#a0a0a0"
            }}>
              Search Contacts
            </label>

            <input
              aria-label="Filter contacts"
              placeholder="Search name, company, email, phone, position, or area..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "7px 10px",
                fontSize: "12px",
                backgroundColor: "#121212",
                border: "1px solid #333",
                borderRadius: "4px",
                color: "#fff",
                outline: "none"
              }}
              onFocus={(e) => e.target.style.borderColor = "#0696D7"}
              onBlur={(e) => e.target.style.borderColor = "#333"}
            />
          </div>

          <div ref={companyFilterRef} style={{ position: "relative", flex: "0 0 210px" }}>
            <label style={{
              display: "block",
              marginBottom: "4px",
              fontWeight: 600,
              fontSize: "11px",
              color: "#a0a0a0"
            }}>
              Filter by Company
            </label>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={companyFilterOpen}
              onClick={() => setCompanyFilterOpen((open) => !open)}
              style={{
                width: "100%",
                padding: "7px 10px",
                backgroundColor: "#121212",
                border: "1px solid #333",
                borderRadius: "4px",
                color: "#fff",
                cursor: "pointer",
                fontSize: "12px",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between"
              }}
            >
              <span>{selectedCompanies.size} of {companies.length} selected</span>
              <span aria-hidden="true">{companyFilterOpen ? "▲" : "▼"}</span>
            </button>

            {companyFilterOpen && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  zIndex: 20,
                  width: "260px",
                  maxHeight: "300px",
                  overflowY: "auto",
                  padding: "6px",
                  backgroundColor: "#1e1e1e",
                  border: "1px solid #444",
                  borderRadius: "6px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
                }}
              >
                <label style={companyOptionStyle}>
                  <input
                    type="checkbox"
                    checked={companies.length > 0 && selectedCompanies.size === companies.length}
                    onChange={toggleAllCompanies}
                  />
                  <span style={{ fontWeight: 700 }}>All companies</span>
                </label>
                <div style={{ height: "1px", backgroundColor: "#3a3a3a", margin: "5px 4px" }} />
                {companies.map((company) => (
                  <label key={company} style={companyOptionStyle}>
                    <input
                      type="checkbox"
                      checked={selectedCompanies.has(company)}
                      onChange={() => toggleCompany(company)}
                    />
                    <span>{company === NO_COMPANY ? "No company" : company}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading && (
          <span style={{ display: "block", marginTop: 8, fontSize: "13px", color: "#a0a0a0" }}>
            Loading contacts…
          </span>
        )}
      </div>

      <div style={{
        backgroundColor: "#1e1e1e",
        border: "1px solid #333",
        borderRadius: "8px",
        overflow: "hidden"
      }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: "40px",
            textAlign: "center"
          }}>
            <h3 style={{ marginBottom: "8px", color: "#fff" }}>No contacts found</h3>
            <p style={{ color: "#a0a0a0", fontSize: "14px" }}>
              {query || selectedCompanies.size !== companies.length
                ? "Try adjusting your search or company filters"
                : "No contacts available"}
            </p>
          </div>
        ) : (
        <div className="table-scroll" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#121212" }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Company</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Position</th>
                  <th style={thStyle}>Area/Equipment</th>
                  <th style={{ ...thStyle, width: "110px" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((c, i) => (
                  <tr
                    key={`${c.id}-${i}`}
                    style={{ transition: "background-color 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#252525"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <td style={tdStyle}>{c.name || "-"}</td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{c.company || "-"}</td>

                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      {c.email ? (
                        <a
                          href={`mailto:${c.email}`}
                          style={{
                            color: "#0696D7",
                            textDecoration: "none"
                          }}
                          onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                          onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                        >
                          {c.email}
                        </a>
                      ) : "-"}
                    </td>

                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      {c.phone ? (
                        <a
                          href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                          style={{
                            color: "#0696D7",
                            textDecoration: "none"
                          }}
                          onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                          onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                        >
                          {c.phone}
                        </a>
                      ) : "-"}
                    </td>

                    <td style={tdStyle}>{c.position || "-"}</td>
                    <td style={tdStyle}>{c.area || "-"}</td>

                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={() => openEditForm(c)}
                        disabled={saving}
                        style={{
                          ...smallActionButtonStyle,
                          opacity: saving ? 0.6 : 1
                        }}
                        title="Edit contact"
                      >
                        Edit
                      </button>

                      {isAdmin && <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        disabled={saving}
                        style={{
                          ...smallActionButtonStyle,
                          color: "#ff7777",
                          opacity: saving ? 0.6 : 1
                        }}
                        title="Delete contact"
                      >
                        Delete
                      </button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p style={{
          marginTop: "16px",
          fontSize: "13px",
          color: "#a0a0a0",
          textAlign: "center"
        }}>
          Showing {filtered.length} of {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
        </p>
      )}

      {showForm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(107, 107, 107, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#464646ff",
            border: "2px solid #000000ff",
            borderRadius: "8px",
            padding: "24px",
            maxWidth: "500px",
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h2 style={{ fontSize: "24px", marginBottom: "16px", color: "#fff" }}>
              {formMode === "edit" ? "Edit Contact" : "Add New Contact"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>
                  Name <span style={{ color: "#0696D7" }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter full name"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "#0696D7"}
                  onBlur={(e) => e.target.style.borderColor = "#ced4da"}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>
                  Company <span style={{ color: "#666", fontSize: "12px" }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "#0696D7"}
                  onBlur={(e) => e.target.style.borderColor = "#ced4da"}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>
                  Email <span style={{ color: "#666", fontSize: "12px" }}>(Optional)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "#0696D7"}
                  onBlur={(e) => e.target.style.borderColor = "#ced4da"}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>
                  Phone <span style={{ color: "#666", fontSize: "12px" }}>(Optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "#0696D7"}
                  onBlur={(e) => e.target.style.borderColor = "#ced4da"}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>
                  Position <span style={{ color: "#666", fontSize: "12px" }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="Enter job position"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "#0696D7"}
                  onBlur={(e) => e.target.style.borderColor = "#ced4da"}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>
                  Area/Equipment <span style={{ color: "#666", fontSize: "12px" }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  placeholder="Enter area or equipment"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = "#0696D7"}
                  onBlur={(e) => e.target.style.borderColor = "#ced4da"}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#333",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s",
                    opacity: saving ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#444"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "#333"}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: saving ? "#6c757d" : "#0696D7",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) e.target.style.backgroundColor = "#0580bd";
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) e.target.style.backgroundColor = "#0696D7";
                  }}
                >
                  {saving
                    ? "Saving..."
                    : formMode === "edit"
                      ? "Save Changes"
                      : "Add Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
