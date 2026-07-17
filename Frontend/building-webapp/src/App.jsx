import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { SiteProvider } from "./contexts/SiteContext";
import { AdminProvider } from "./contexts/AdminContext";
import Hotbar from "./components/Hotbar";
import Home from "./pages/Home";
import Schedules from "./pages/Schedules";
import Contacts from "./pages/Contacts";
import Issues from "./pages/Issues";
import Assets from "./pages/Assets";
import CommissioningReport from "./pages/CommissioningReport";
import Buildings from "./pages/Buildings";
import BuildingView from "./pages/BuildingView";
import RoomView from "./pages/RoomView";
import "./responsive.css";
import { AccessProvider } from "./contexts/AccessContext";
import AccessGate from "./components/AccessGate";

function Layout() {
  return (
    <div>
      <Hotbar />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AccessProvider>
        <AccessGate>
          <SiteProvider>
            <AdminProvider>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="schedules" element={<Schedules />} />
                  <Route path="contacts" element={<Contacts />} />
                  <Route path="issues" element={<Issues />} />
                  <Route path="assets" element={<Assets />} />
                  <Route path="commissioning-report" element={<CommissioningReport />} />
                  <Route path="buildings" element={<Buildings />} />
                  <Route path="buildings/:id" element={<BuildingView />} />
                  <Route path="buildings/:id/rooms/:roomId" element={<RoomView />} />
                </Route>
              </Routes>
            </AdminProvider>
          </SiteProvider>
        </AccessGate>
      </AccessProvider>
    </BrowserRouter>
  );
}

export default App;
