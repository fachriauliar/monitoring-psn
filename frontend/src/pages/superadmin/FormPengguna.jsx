import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import "../../assets/styles/FormPengguna.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const initialFormData = {
  nama_lengkap: "",
  nip: "",
  email: "",
  no_hp: "",
  jabatan: "",
  bagian: "",
  pangkat_golongan: "",
  role: "admin",
};

function getErrorMessage(message, fallback) {
  if (Array.isArray(message)) return message.join(", ");
  return message || fallback;
}

function FormPengguna() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = Boolean(id);
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchPenggunaDetail = useCallback(async () => {
    try {
      setFetching(true);
      setErrorMessage("");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await fetch(`${API_URL}/api/pengguna/${id}`, {
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
          getErrorMessage(result.message, "Gagal mengambil data pengguna."),
        );
      }

      const pengguna = result.data;

      setFormData({
        ...initialFormData,
        nama_lengkap: pengguna.nama_lengkap || "",
        nip: pengguna.nip || "",
        email: pengguna.email || "",
        no_hp: pengguna.no_hp || "",
        jabatan: pengguna.jabatan || "",
        bagian: pengguna.bagian || "",
        pangkat_golongan: pengguna.pangkat_golongan || "",
        role: pengguna.role || "admin",
      });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setFetching(false);
    }
  }, [id, token, navigate]);

  useEffect(() => {
    if (isEdit) {
      fetchPenggunaDetail();
    } else {
      setFetching(false);
    }
  }, [isEdit, fetchPenggunaDetail]);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (!formData.nama_lengkap.trim()) {
      setErrorMessage("Nama lengkap wajib diisi.");
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage("Email wajib diisi.");
      return;
    }

    // Cegah pengguna mengubah role akun sendiri.
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    if (
      isEdit &&
      Number(id) === Number(currentUser.id_pengguna) &&
      formData.role !== currentUser.role
    ) {
      setErrorMessage("Anda tidak dapat mengubah role akun sendiri.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        nama_lengkap: formData.nama_lengkap.trim(),
        nip: formData.nip.trim(),
        email: formData.email.trim(),
        no_hp: formData.no_hp.trim(),
        jabatan: formData.jabatan.trim(),
        bagian: formData.bagian.trim(),
        pangkat_golongan: formData.pangkat_golongan.trim(),
        role: formData.role,
      };

      const response = await fetch(
        isEdit ? `${API_URL}/api/pengguna/${id}` : `${API_URL}/api/pengguna`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(result.message, "Gagal menyimpan data pengguna."),
        );
      }

      if (isEdit) {
        window.alert(result.message || "Data pengguna berhasil diperbarui.");
      } else {
        const passwordSementara =
          result.data?.password_sementara || result.password_sementara;

        if (passwordSementara) {
          window.alert(
            `Pengguna berhasil ditambahkan.\n\n` +
              `Email: ${formData.email.trim()}\n` +
              `Password sementara: ${passwordSementara}\n\n` +
              `Berikan password sementara ini kepada pengguna. ` +
              `Jangan tampilkan atau bagikan kembali password ini setelah pesan ditutup.`,
          );
        } else {
          window.alert(result.message || "Pengguna berhasil ditambahkan.");
        }
      }

      navigate("/superadmin/data-pengguna", { replace: true });
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    navigate("/superadmin/data-pengguna");
  }

  if (fetching) {
    return (
      <div className="form-pengguna">
        <div className="form-pengguna-loading">Memuat data pengguna...</div>
      </div>
    );
  }

  return (
    <div className="form-pengguna">
      <div className="form-pengguna-header">
        <div>
          <h1>{isEdit ? "Edit Pengguna" : "Tambah Pengguna"}</h1>
          <p>
            {isEdit
              ? "Perbarui informasi akun pengguna."
              : "Tambahkan akun Admin Kelurahan atau Superadmin baru."}
          </p>
        </div>

        <button
          type="button"
          className="btn-kembali-pengguna"
          onClick={handleBack}
          disabled={loading}
        >
          <ArrowLeft size={18} />
          Kembali
        </button>
      </div>

      <form className="form-pengguna-container" onSubmit={handleSubmit}>
        <div className="form-pengguna-section-header">
          <h2>Informasi Akun</h2>
          <p>Lengkapi informasi identitas dan akun pengguna.</p>
        </div>
        {errorMessage && (
          <div className="form-pengguna-error">{errorMessage}</div>
        )}
        <div className="form-pengguna-grid">
          <div className="form-pengguna-group">
            <label>
              Nama Lengkap <span>*</span>
            </label>
            <input
              type="text"
              name="nama_lengkap"
              value={formData.nama_lengkap}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap"
              maxLength={150}
              required
              disabled={loading}
            />
          </div>

          <div className="form-pengguna-group">
            <label>NIP</label>
            <input
              type="text"
              name="nip"
              value={formData.nip}
              onChange={handleChange}
              placeholder="Masukkan NIP"
              maxLength={30}
              disabled={loading}
            />
          </div>

          <div className="form-pengguna-group">
            <label>
              Email <span>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contoh@kelurahan.go.id"
              maxLength={150}
              required
              disabled={loading}
            />
          </div>

          <div className="form-pengguna-group">
            <label>Nomor HP</label>
            <input
              type="tel"
              name="no_hp"
              value={formData.no_hp}
              onChange={handleChange}
              placeholder="Masukkan nomor HP"
              maxLength={25}
              disabled={loading}
            />
          </div>

          <div className="form-pengguna-group">
            <label>Jabatan</label>
            <input
              type="text"
              name="jabatan"
              value={formData.jabatan}
              onChange={handleChange}
              placeholder="Contoh: Staf Kelurahan"
              maxLength={120}
              disabled={loading}
            />
          </div>

          <div className="form-pengguna-group">
            <label>Bagian</label>
            <input
              type="text"
              name="bagian"
              value={formData.bagian}
              onChange={handleChange}
              placeholder="Contoh: Kesejahteraan Rakyat"
              maxLength={120}
              disabled={loading}
            />
          </div>

          <div className="form-pengguna-group">
            <label>Pangkat / Golongan</label>
            <input
              type="text"
              name="pangkat_golongan"
              value={formData.pangkat_golongan}
              onChange={handleChange}
              placeholder="Contoh: III/a"
              maxLength={50}
              disabled={loading}
            />
          </div>

          <div className="form-pengguna-group">
            <label>
              Role Pengguna <span>*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="admin">Admin Kelurahan</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
        </div>

        {!isEdit && (
          <div className="form-pengguna-info">
            <p>Password default untuk akun baru:</p>

            <strong className="password-default">Psn@2026Awal</strong>

            <p>
              Berikan password ini kepada pengguna. Pengguna wajib mengganti
              password setelah berhasil login pertama kali.
            </p>
          </div>
        )}

        <div className="form-pengguna-footer">
          <button
            type="button"
            className="btn-batal-pengguna"
            onClick={handleBack}
            disabled={loading}
          >
            Batal
          </button>

          <button
            type="submit"
            className="btn-simpan-pengguna"
            disabled={loading}
          >
            <Save size={18} />
            {loading
              ? "Menyimpan..."
              : isEdit
                ? "Simpan Perubahan"
                : "Simpan Pengguna"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormPengguna;
