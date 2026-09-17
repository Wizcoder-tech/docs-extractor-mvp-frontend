import { useEffect, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes } from "react-router-dom";
import Icon from "./components/Icon";
import ShipmentDetailPage from "./pages/ShipmentDetailPage";
import ShipmentListPage from "./pages/ShipmentListPage";
import UploadPage from "./pages/UploadPage";

const SIDEBAR_COLLAPSED_KEY = "sidebarCollapsed";

export default function App() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
      // ignore storage errors (private browsing, etc.)
    }
  }, [collapsed]);

  return (
    <div className="app-shell">
      <aside className={collapsed ? "sidebar sidebar--collapsed" : "sidebar"}>
        <div className="sidebar-header">
          <Link to="/shipments" className="sidebar-brand">
            <Icon name="file-check" className="logomark" />
            <span className="sidebar-brand-text">Docs Extractor</span>
          </Link>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon name="panel-left" />
          </button>
        </div>
        <nav className="sidebar-nav">
          <NavLink
            to="/upload"
            className={({ isActive }) => (isActive ? "sidebar-link sidebar-link--active" : "sidebar-link")}
          >
            <Icon name="upload-cloud" />
            <span className="sidebar-link-text">Upload</span>
          </NavLink>
          <NavLink
            to="/shipments"
            className={({ isActive }) => (isActive ? "sidebar-link sidebar-link--active" : "sidebar-link")}
          >
            <Icon name="file-text" />
            <span className="sidebar-link-text">Shipments</span>
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
