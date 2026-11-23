import React, { useCallback, useEffect, useState } from "react";
import { UserRound, Save, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../assets/styles/Profile.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const initialForm = {
  nama_lengkap: "",
  nip: "",
  email: "",
  no_hp: "",
  jabatan: "",
  bagian: "",
  pangkat_golongan: "",
};

function Profile() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");
  const [statusAkun, setStatusAkun] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const token = localStorage.getItem("token");

  const getErrorMessage = (message, fallback) => {
    if (Array.isArray(message)) return message.join(", ");
    return message || fallback;
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await fetch(`${API_URL}/api/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(result.message, "Gagal mengambil data profil."),
        );
      }

      const profile = result.data;

      setForm({
        nama_lengkap: profile.nama_lengkap || "",
        nip: profile.nip || "",
        email: profile.email || "",
        no_hp: profile.no_hp || "",
        jabatan: profile.jabatan || "",
        bagian: profile.bagian || "",
        pangkat_golongan: profile.pangkat_golongan || "",
      });

      setUserId(profile.id_pengguna || "");
      setRole(profile.role || "");
      setStatusAkun(profile.status_akun || "");

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...JSON.parse(localStorage.getItem("user") || "{}"),
          ...profile,
        }),
      );
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat mengambil profil.");
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setNotice("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setNotice("");

    if (!form.nama_lengkap.trim()) {
      setError("Nama lengkap wajib diisi.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email wajib diisi.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        nama_lengkap: form.nama_lengkap.trim(),
        nip: form.nip.trim(),
        email: form.email.trim(),
        no_hp: form.no_hp.trim(),
        jabatan: form.jabatan.trim(),
        bagian: form.bagian.trim(),
        pangkat_golongan: form.pangkat_golongan.trim(),
      };

      const response = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(result.message, "Gagal memperbarui profil."),
        );
      }

      await fetchProfile();

      setNotice(result.message || "Perubahan profil berhasil disimpan.");
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setSaving(false);
    }
  }

  function getRoleLabel(value) {
    const roles = {
      admin: "ADMIN KELURAHAN",
      kasie: "KASIE KESRA",
    };

    return roles[value] || "PENGGUNA";
  }

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-panel profile-loading">
          Memuat informasi profil...
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <div className="profile-page-title">
        <h1>Profil Saya</h1>
        <p>Kelola informasi akun dan informasi kontak Anda.</p>
      </div>

      {error && <div className="profile-error">{error}</div>}

      <form className="profile-layout" onSubmit={handleSubmit}>
        <section className="profile-panel profile-card">
          <div className="profile-avatar">
            <UserRound size={68} />
          </div>

          <h2>{form.nama_lengkap || "Pengguna"}</h2>

          <span className="profile-role">{getRoleLabel(role)}</span>

          <p className="profile-note">ID Pengguna</p>
          <strong className="profile-readonly">{userId || "-"}</strong>

          <p className="profile-note">Email</p>
          <strong className="profile-readonly">{form.email || "-"}</strong>

          <p className="profile-note">Nomor Telepon</p>
          <strong className="profile-readonly">{form.no_hp || "-"}</strong>

          <p className="profile-note">Status Akun</p>
          <strong className="profile-readonly">{statusAkun || "-"}</strong>
        </section>

        <section className="profile-panel profile-form">
          <h2>Informasi Pribadi</h2>

          <p className="profile-description">
            Informasi ini digunakan sebagai identitas akun pada sistem
            Monitoring PSN dan Jumantik.
          </p>

          <div className="profile-form-grid">
            <label>
              Nama Lengkap
              <input
                name="nama_lengkap"
                value={form.nama_lengkap}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap"
                maxLength={150}
                required
                disabled={saving}
              />
            </label>

            <label>
              NIP
              <input
                name="nip"
                value={form.nip}
                onChange={handleChange}
                placeholder="Masukkan NIP"
                maxLength={30}
                disabled={saving}
              />
            </label>

            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Masukkan email"
                maxLength={150}
                required
                disabled={saving}
              />
            </label>

            <label>
              Nomor Telepon
              <input
                name="no_hp"
                type="tel"
                value={form.no_hp}
                onChange={handleChange}
                placeholder="Masukkan nomor telepon"
                maxLength={25}
                disabled={saving}
              />
            </label>

            <label>
              Jabatan
              <input
                name="jabatan"
                value={form.jabatan}
                onChange={handleChange}
                placeholder="Masukkan jabatan"
                maxLength={120}
                disabled={saving}
              />
            </label>

            <label>
              Bagian
              <input
                name="bagian"
                value={form.bagian}
                onChange={handleChange}
                placeholder="Masukkan bagian"
                maxLength={120}
                disabled={saving}
              />
            </label>

            <label className="profile-full">
              Pangkat / Golongan
              <input
                name="pangkat_golongan"
                value={form.pangkat_golongan}
                onChange={handleChange}
                placeholder="Contoh: III/a"
                maxLength={50}
                disabled={saving}
              />
            </label>
          </div>

          {notice && <div className="profile-notice">{notice}</div>}

          <div className="profile-form-actions">
            <button
              type="button"
              className="profile-secondary-btn"
              onClick={fetchProfile}
              disabled={saving || loading}
            >
              <RefreshCw size={16} />
              Muat Ulang
            </button>

            <button
              type="submit"
              className="profile-primary-btn"
              disabled={saving}
            >
              <Save size={16} />
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}

export default Profile;
