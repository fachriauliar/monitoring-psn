import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  ChartNoAxesCombined,
  ClipboardCheck,
  AlertTriangle,
  FileBarChart,
  Bell,
  Menu,
  LogOut,
  ShieldCheck,
  UserCircle,
  UserCog,
  Users,
  ClipboardList,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import "./layouts.css";

export const superadminMenus = [
  {
    label: "Dashboard",
    path: "/superadmin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Profil Saya",
    path: "/superadmin/profil",
    icon: UserCircle,
  },
  {
    label: "Data Pengguna",
    path: "/superadmin/data-pengguna",
    icon: UserCog,
  },
  {
    label: "Data Jumantik",
    path: "/superadmin/jumantik",
    icon: Users,
  },
  {
    label: "Data Wilayah",
    path: "/superadmin/wilayah",
    icon: Map,
  },
  {
    label: "Monitoring Pemeriksaan PSN",
    path: "/superadmin/monitoring-pemeriksaan",
    icon: ClipboardList,
  },
  {
    label: "Rekapitulasi Pemeriksaan",
    path: "/superadmin/rekapitulasi",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Evaluasi Tindak Lanjut",
    path: "/superadmin/evaluasi",
    icon: ClipboardCheck,
  },
  {
    label: "Wilayah Perhatian",
    path: "/superadmin/wilayah-perhatian",
    icon: AlertTriangle,
  },
  {
    label: "Laporan",
    path: "/superadmin/laporan",
    icon: FileBarChart,
  },
];

export default function SuperadminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const namaPengguna = user?.nama_lengkap || "Superadmin";

  const inisial =
    namaPengguna
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((kata) => kata.charAt(0))
      .join("")
      .toUpperCase() || "S";

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-brand">
          <div className="dashboard-brand-icon">
            <ShieldCheck size={23} />
          </div>

          <div>
            <strong>Monitoring PSN</strong>
            <span>Superadmin Kesra</span>
          </div>
        </div>

        <div className="sidebar-section-label">MENU MONITORING</div>

        <nav className="dashboard-menu">
          {superadminMenus.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/superadmin/dashboard"}
                className={({ isActive }) =>
                  `dashboard-menu-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div className="sidebar-bottom">
          <button
            type="button"
            className="dashboard-menu-link logout-link"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              aria-label="Buka menu"
            >
              <Menu size={21} />
            </button>

            <div>
              <strong>Panel Monitoring</strong>
              <span>Kelurahan Srengseng Sawah</span>
            </div>
          </div>

          <div className="topbar-right">
            <button
              type="button"
              className="topbar-icon-button"
              aria-label="Notifikasi"
            >
              <Bell size={19} />
            </button>

            <div className="topbar-user">
              <div className="user-avatar">{inisial}</div>

              <div>
                <strong>{namaPengguna}</strong>
                <span>Superadmin Kesra</span>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
