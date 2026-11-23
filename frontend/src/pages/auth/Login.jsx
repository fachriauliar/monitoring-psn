import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import logoJakarta from "../../assets/images/Logo-Jakarta-Selatan.png";

import "./AuthPages.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =======================================================
  // PROSES LOGIN
  // =======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await login(email.trim(), password);

      const user = result.user;

      // Pengguna wajib mengganti password terlebih dahulu.
      if (result.wajib_ubah_password) {
        navigate("/ubah-password", {
          replace: true,
        });

        return;
      }

      // Menentukan dashboard berdasarkan role.
      const dashboard =
        user.role === "superadmin"
          ? "/superadmin/dashboard"
          : user.role === "admin"
            ? "/admin/dashboard"
            : null;

      if (!dashboard) {
        throw new Error("Role akun tidak dikenali.");
      }

      // Mengarahkan pengguna ke halaman sebelumnya
      // jika halaman tersebut sesuai dengan role pengguna.
      const previousPath = location.state?.from?.pathname;

      const allowedPreviousPath =
        user.role === "admin"
          ? previousPath?.startsWith("/admin/")
          : previousPath?.startsWith("/superadmin/");

      navigate(allowedPreviousPath ? previousPath : dashboard, {
        replace: true,
      });
    } catch (err) {
      setError(
        err.message || "Tidak dapat terhubung ke server. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // TAMPILAN LOGIN
  // =======================================================

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <img src={logoJakarta} alt="Logo Jakarta Selatan" />

          <div>
            <b>Kelurahan Srengseng Sawah</b>
            <b>Kota Jakarta Selatan</b>
          </div>
        </div>

        <div className="auth-brand-content">
          <span>Selamat datang kembali</span>

          <h2>Masuk untuk mengakses layanan kelurahan kapan saja</h2>
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-container">
          <h1>Selamat datang kembali</h1>

          <p className="auth-subtitle">
            Masukkan email dan sandi akun Anda untuk melanjutkan.
          </p>

          <form onSubmit={handleSubmit}>
            {/* EMAIL */}
            <div className="auth-input-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>

            {/* PASSWORD */}
            <div className="auth-input-group auth-password-group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Kata Sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />

              <button
                type="button"
                className="auth-eye-button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={
                  showPassword
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* ERROR */}
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="auth-help-text">
            Lupa kata sandi? Silakan hubungi Superadmin untuk melakukan reset
            kata sandi akun Anda.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
