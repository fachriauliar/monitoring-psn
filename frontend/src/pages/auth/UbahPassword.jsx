import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import logoJakarta from "../../assets/images/Logo-Jakarta-Selatan.png";

import "./AuthPages.css";

function UbahPassword() {
  const navigate = useNavigate();

  const { user, changePassword, logout } = useAuth();

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

  // =======================================================
  // TAMPILKAN / SEMBUNYIKAN PASSWORD
  // =======================================================

  const togglePassword = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // =======================================================
  // PROSES UBAH PASSWORD
  // =======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Validasi panjang password.
    if (newPassword.length < 8) {
      setError("Kata sandi baru minimal 8 karakter.");
      return;
    }

    if (newPassword.length > 72) {
      setError("Kata sandi baru maksimal 72 karakter.");
      return;
    }

    // Validasi konfirmasi password.
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak sesuai.");
      return;
    }

    // Password baru tidak boleh sama dengan password lama.
    if (currentPassword === newPassword) {
      setError("Kata sandi baru harus berbeda dari kata sandi saat ini.");
      return;
    }

    if (!user) {
      logout();
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);

    try {
      await changePassword({
        password_lama: currentPassword,
        password_baru: newPassword,
        konfirmasi_password: confirmPassword,
      });

      setSuccess("Kata sandi berhasil diperbarui.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Arahkan ke dashboard sesuai role.
      const dashboard =
        user.role === "superadmin"
          ? "/superadmin/dashboard"
          : "/admin/dashboard";

      // Berikan waktu agar pesan berhasil terlihat.
      setTimeout(() => {
        navigate(dashboard, { replace: true });
      }, 1200);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat mengubah kata sandi.");
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // TAMPILAN
  // =======================================================

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
            {/* KATA SANDI SAAT INI */}
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
                  disabled={loading}
                />

                <button
                  type="button"
                  className="auth-eye-button"
                  onClick={() => togglePassword("current")}
                  aria-label={
                    showPassword.current
                      ? "Sembunyikan kata sandi saat ini"
                      : "Tampilkan kata sandi saat ini"
                  }
                  disabled={loading}
                >
                  {showPassword.current ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* KATA SANDI BARU */}
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
                  disabled={loading}
                />

                <button
                  type="button"
                  className="auth-eye-button"
                  onClick={() => togglePassword("new")}
                  aria-label={
                    showPassword.new
                      ? "Sembunyikan kata sandi baru"
                      : "Tampilkan kata sandi baru"
                  }
                  disabled={loading}
                >
                  {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <small className="auth-field-hint">
                Minimal 8 karakter dan maksimal 72 karakter.
              </small>
            </div>

            {/* KONFIRMASI KATA SANDI */}
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
                  disabled={loading}
                />

                <button
                  type="button"
                  className="auth-eye-button"
                  onClick={() => togglePassword("confirm")}
                  aria-label={
                    showPassword.confirm
                      ? "Sembunyikan konfirmasi kata sandi"
                      : "Tampilkan konfirmasi kata sandi"
                  }
                  disabled={loading}
                >
                  {showPassword.confirm ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* PESAN ERROR */}
            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            {/* PESAN BERHASIL */}
            {success && (
              <p className="auth-success" role="status">
                {success}
              </p>
            )}

            {/* TOMBOL SIMPAN */}
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
