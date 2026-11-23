
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import logoJakarta from "../../assets/images/Logo-Jakarta-Selatan.png";
import "./AuthPages.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Login({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Email atau kata sandi tidak sesuai.");
      }

      const user = result.data.user;
      const token = result.data.token;

      // Simpan token dan data pengguna
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Jalankan callback jika disediakan oleh App
      if (onLogin) {
        await onLogin({
          success: true,
          user,
          token,
          wajib_ubah_password: user.wajib_ubah_password,
        });
      }

      // Pengguna dengan password sementara wajib menggantinya
      if (user.wajib_ubah_password) {
        navigate("/ubah-password", { replace: true });
        return;
      }

      // Arahkan berdasarkan role
      switch (user.role) {
        case "admin":
          navigate("/admin/dashboard", { replace: true });
          break;

        case "kasie":
          navigate("/kasie/dashboard", { replace: true });
          break;

        default:
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setError("Role akun tidak dikenali.");
      }
    } catch (err) {
      setError(
        err.message || "Tidak dapat terhubung ke server. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

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
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                }
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="auth-help-text">
            Lupa kata sandi? Silakan hubungi Kasie Kesra untuk melakukan reset
            kata sandi akun Anda.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
