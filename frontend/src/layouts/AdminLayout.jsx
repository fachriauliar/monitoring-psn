import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  Users,
  ClipboardList,
  Camera,
  CalendarDays,
  Newspaper,
  Megaphone,
  FileBarChart,
  Bell,
  Menu,
  LogOut,
  ShieldCheck,
  UserCircle,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import "./layouts.css";

export const adminMenus = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Profil Saya",
    path: "/admin/profil",
    icon: UserCircle,
  },
  {
    label: "Data Wilayah",
    path: "/admin/wilayah",
    icon: Map,
  },
  {
    label: "Data Jumantik",
    path: "/admin/jumantik",
    icon: Users,
  },
  {
    label: "Data Pemeriksaan PSN",
    path: "/admin/data-pemeriksaan",
    icon: ClipboardList,
  },
  {
    label: "Dokumentasi Kegiatan",
    path: "/admin/dokumentasi",
    icon: Camera,
  },
  {
    label: "Jadwal PSN",
    path: "/admin/jadwal",
    icon: CalendarDays,
  },
  {
    label: "Berita",
    path: "/admin/berita",
    icon: Newspaper,
  },
  {
    label: "Pengumuman",
    path: "/admin/pengumuman",
    icon: Megaphone,
  },
  {
    label: "Laporan",
    path: "/admin/laporan",
    icon: FileBarChart,
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const namaPengguna = user?.nama_lengkap || "Administrator";

  const inisial =
    namaPengguna
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((kata) => kata.charAt(0))
      .join("")
      .toUpperCase() || "A";

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
            <span>Admin Kelurahan</span>
          </div>
        </div>

        <div className="sidebar-section-label">MENU UTAMA</div>

        <nav className="dashboard-menu">
          {adminMenus.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin/dashboard"}
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
              <strong>Panel Admin</strong>
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
                <span>Admin Kelurahan</span>
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
