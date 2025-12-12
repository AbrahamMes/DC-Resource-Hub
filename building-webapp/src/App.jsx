import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Hotbar from "./components/Hotbar";
import Home from "./pages/Home";
import Schedule from "./pages/Schedule";
import Contacts from "./pages/Contacts";
import Issues from "./pages/Issues";
import Assets from "./pages/Assets";
import CommissioningReport from "./pages/CommissioningReport";
import Buildings from "./pages/Buildings";
import BuildingPage from "./pages/BuildingPage";

function Layout() {
  return (
    <div>
      <Hotbar />
      <main style={{ padding: 20, marginTop: 64 }}>
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="issues" element={<Issues />} />
          <Route path="assets" element={<Assets />} />
          <Route path="commissioning-report" element={<CommissioningReport />} />
          <Route path="buildings" element={<Buildings />} />
          <Route path="buildings/:id" element={<BuildingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
