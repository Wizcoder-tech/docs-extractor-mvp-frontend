import { Link, Navigate, NavLink, Route, Routes } from "react-router-dom";
import Icon from "./components/Icon";
import ShipmentDetailPage from "./pages/ShipmentDetailPage";
import ShipmentListPage from "./pages/ShipmentListPage";
import UploadPage from "./pages/UploadPage";

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/shipments" className="sidebar-brand">
          <Icon name="file-check" className="logomark" />
          Docs Extractor
        </Link>
        <nav className="sidebar-nav">
          <NavLink
            to="/upload"
            className={({ isActive }) => (isActive ? "sidebar-link sidebar-link--active" : "sidebar-link")}
          >
            <Icon name="upload-cloud" />
            Upload
          </NavLink>
          <NavLink
            to="/shipments"
            className={({ isActive }) => (isActive ? "sidebar-link sidebar-link--active" : "sidebar-link")}
          >
            <Icon name="file-text" />
            Shipments
          </NavLink>
        </nav>
      </aside>
      <main className="app-main">
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
