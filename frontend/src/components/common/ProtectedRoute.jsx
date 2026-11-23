import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({
  allowedRoles = [],
  allowPasswordChange = false,
  children,
}) {
  const { user, loading, isAuthenticated } = useAuth();

  const location = useLocation();

  // Menunggu pemeriksaan sesi selesai.
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#52645a",
          fontSize: "14px",
        }}
      >
        Memeriksa sesi pengguna...
      </div>
    );
  }

  // Pengguna belum login.
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Memastikan role pengguna sesuai.
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const correctDashboard =
      user.role === "superadmin" ? "/superadmin/dashboard" : "/admin/dashboard";

    return <Navigate to={correctDashboard} replace />;
  }

  // Pengguna wajib mengganti password terlebih dahulu.
  if (user.wajib_ubah_password && !allowPasswordChange) {
    return <Navigate to="/ubah-password" replace />;
  }

  // Pengguna tidak perlu lagi berada di halaman ubah password.
  if (!user.wajib_ubah_password && allowPasswordChange) {
    const correctDashboard =
      user.role === "superadmin" ? "/superadmin/dashboard" : "/admin/dashboard";

    return <Navigate to={correctDashboard} replace />;
  }

  return children || <Outlet />;
}
