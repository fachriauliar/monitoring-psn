
import { NavLink, Outlet } from "react-router-dom";
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
  ClipboardList
} from "lucide-react";
import "./layouts.css";

export const kasieMenus = [
  {
    label: "Dashboard",
    path: "/kasie/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Profil Saya",
    path: "/kasie/profil",
    icon: UserCircle,
  },
  {
    label: "Data Pengguna",
    path: "/kasie/data-pengguna",
    icon: UserCog,
  },
  {
    label: "Data Jumantik",
    path: "/kasie/jumantik",
    icon: Users,
  },
  {
    label: "Data Wilayah",
    path: "/kasie/wilayah",
    icon: Map,
  },
  {
    label: "Monitoring Pemeriksaan PSN",
    path: "/kasie/monitoring-pemeriksaan",
    icon: ClipboardList,
  },
  {
    label: "Rekapitulasi Pemeriksaan",
    path: "/kasie/rekapitulasi",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Evaluasi Tindak Lanjut",
    path: "/kasie/evaluasi",
    icon: ClipboardCheck,
  },
  {
    label: "Wilayah Perhatian",
    path: "/kasie/wilayah-perhatian",
    icon: AlertTriangle,
  },
  {
    label: "Laporan",
    path: "/kasie/laporan",
    icon: FileBarChart,
  },
];

export default function KasieLayout() {
  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-brand">
          <div className="dashboard-brand-icon">
            <ShieldCheck size={23} />
          </div>
          <div>
            <strong>Monitoring PSN</strong>
            <span>Kasie Kesra</span>
          </div>
        </div>

        <div className="sidebar-section-label">MENU MONITORING</div>

        <nav className="dashboard-menu">
          {kasieMenus.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/kasie/dashboard"}
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

        <div className="sidebar-bottom">
          <NavLink to="/login" className="dashboard-menu-link logout-link">
            <LogOut size={19} />
            <span>Keluar</span>
          </NavLink>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button className="mobile-menu-button" aria-label="Buka menu">
              <Menu size={21} />
            </button>
            <div>
              <strong>Panel Monitoring</strong>
              <span>Kelurahan Srengseng Sawah</span>
            </div>
          </div>

          <div className="topbar-right">
            <button className="topbar-icon-button" aria-label="Notifikasi">
              <Bell size={19} />
            </button>
            <div className="topbar-user">
              <div className="user-avatar">K</div>
              <div>
                <strong>Kasie Kesra</strong>
                <span>Evaluator</span>
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
