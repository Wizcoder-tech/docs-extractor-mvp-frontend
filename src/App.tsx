import { Link, Navigate, NavLink, Route, Routes } from "react-router-dom";
import ShipmentDetailPage from "./pages/ShipmentDetailPage";
import ShipmentListPage from "./pages/ShipmentListPage";
import UploadPage from "./pages/UploadPage";

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/shipments" className="app-title">
          <span className="app-logo" aria-hidden>
            📦
          </span>
          Navitrax Docs Extractor
        </Link>
        <nav>
          <NavLink to="/upload" className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")}>
            Upload
          </NavLink>
          <NavLink
            to="/shipments"
            className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")}
          >
            Shipments
          </NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/shipments" replace />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/shipments" element={<ShipmentListPage />} />
          <Route path="/shipments/:shipmentId" element={<ShipmentDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}
