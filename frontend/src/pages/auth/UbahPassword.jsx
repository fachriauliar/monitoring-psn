import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import logoJakarta from "../../assets/images/Logo-Jakarta-Selatan.png";
import "./AuthPages.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function UbahPassword() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const togglePassword = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Validasi kata sandi baru
    if (newPassword.length < 8) {
      setError("Kata sandi baru minimal 8 karakter.");
      return;
    }

    if (newPassword.length > 72) {
      setError("Kata sandi baru maksimal 72 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak sesuai.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Kata sandi baru harus berbeda dari kata sandi saat ini.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password_lama: currentPassword,
          password_baru: newPassword,
          konfirmasi_password: confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          navigate("/login", { replace: true });
          return;
        }

        throw new Error(result.message || "Gagal mengubah kata sandi.");
      }

      setSuccess("Kata sandi berhasil diperbarui.");

      // Perbarui informasi wajib ubah password pada localStorage
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);

          localStorage.setItem(
            "user",
            JSON.stringify({
              ...user,
              wajib_ubah_password: false,
            }),
          );
        } catch {
          // Abaikan jika data user di localStorage tidak valid
        }
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Arahkan berdasarkan role pengguna
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      setTimeout(() => {
        if (user.role === "kasie") {
          navigate("/kasie/dashboard", { replace: true });
        } else {
          navigate("/admin/dashboard", { replace: true });
        }
      }, 1200);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat mengubah kata sandi.");
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
            <b>Kelurahan</b>
            <b>Srengseng Sawah</b>
          </div>
        </div>

        <div className="auth-brand-content">
          <span>Keamanan akun Anda</span>
          <h2>Buat kata sandi baru untuk menjaga keamanan akun Anda</h2>
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-container">
          <h1>Buat kata sandi baru</h1>

          <p className="auth-subtitle">
            Gunakan kata sandi yang berbeda dari kata sandi sebelumnya.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Kata sandi saat ini */}
            <div className="auth-field">
              <label>Kata sandi saat ini</label>

              <div className="auth-input-group auth-password-group">
                <input
                  type={showPassword.current ? "text" : "password"}
                  placeholder="Masukkan kata sandi saat ini"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="auth-eye-button"
                  onClick={() => togglePassword("current")}
                  aria-label="Tampilkan kata sandi saat ini"
                >
                  {showPassword.current ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Kata sandi baru */}
            <div className="auth-field">
              <label>Kata sandi baru</label>

              <div className="auth-input-group auth-password-group">
                <input
                  type={showPassword.new ? "text" : "password"}
                  placeholder="Masukkan kata sandi baru"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="auth-eye-button"
                  onClick={() => togglePassword("new")}
                  aria-label="Tampilkan kata sandi baru"
                >
                  {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <small className="auth-field-hint">
                Minimal 8 karakter dan maksimal 72 karakter.
              </small>
            </div>

            {/* Konfirmasi kata sandi */}
            <div className="auth-field">
              <label>Konfirmasi kata sandi</label>

              <div className="auth-input-group auth-password-group">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  placeholder="Masukkan ulang kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="auth-eye-button"
                  onClick={() => togglePassword("confirm")}
                  aria-label="Tampilkan konfirmasi kata sandi"
                >
                  {showPassword.confirm ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Pesan error */}
            {error && <p className="auth-error">{error}</p>}

            {/* Pesan berhasil */}
            {success && <p className="auth-success">{success}</p>}

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan Kata Sandi"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default UbahPassword;
