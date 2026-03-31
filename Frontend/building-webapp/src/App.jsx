import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { SiteProvider } from "./contexts/SiteContext";
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

function Layout() {
  return (
    <div>
      <Hotbar />
      <main style={{ marginTop: 45, paddingTop: 5, paddingLeft: 0, paddingRight: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SiteProvider>
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
      </SiteProvider>
    </BrowserRouter>
  );
}

export default App;
