import { createContext, useContext, useState } from "react";
import config from "../config";
import { useSite } from "./SiteContext";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const { currentSite } = useSite();
  const [adminPin, setAdminPin] = useState(null);

  async function enableAdmin() {
    const pin = window.prompt("Enter admin PIN:");
    if (pin === null || !pin.trim()) return false;

    const response = await fetch(`${config.apiBaseUrl}/contacts/admin/verify?site=${encodeURIComponent(currentSite)}`, {
      method: "POST",
      credentials: "include",
      headers: { "x-admin-pin": pin.trim() }
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      window.alert(data.error || "Invalid PIN.");
      setAdminPin(null);
      return false;
    }

    setAdminPin(pin.trim());
    return true;
  }

  function disableAdmin() {
    setAdminPin(null);
  }

  return (
    <AdminContext.Provider value={{ isAdmin: Boolean(adminPin), adminPin, enableAdmin, disableAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used inside AdminProvider");
  return context;
}
