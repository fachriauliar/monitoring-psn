import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  ShieldCheck,
  UserCog,
  RefreshCw,
  UserRound,
  KeyRound,
} from "lucide-react";

import "../../assets/styles/DataPengguna.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const INITIAL_STATISTICS = {
  total_pengguna: 0,
  total_admin: 0,
  total_superadmin: 0,
  total_aktif: 0,
};

function getErrorMessage(message, fallback) {
  if (Array.isArray(message)) {
    return message.join(", ");
  }

  return message || fallback;
}

function DataPengguna() {
  const navigate = useNavigate();

  // Data pengguna
  const [userList, setUserList] = useState([]);

  // Statistik
  const [statistics, setStatistics] = useState(INITIAL_STATISTICS);

  // Filter
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Kondisi halaman
  const [loading, setLoading] = useState(true);
  const [loadingStatistics, setLoadingStatistics] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Notifikasi
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Pagination
  const [totalUsers, setTotalUsers] = useState(0);

  // Mengambil token terbaru
  const getToken = () => localStorage.getItem("token");

  // Menangani sesi login
  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  }, [navigate]);

  // Mengambil daftar pengguna
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const params = new URLSearchParams({
        search,
        role: filterRole,
        status: filterStatus,
        page: "1",
        limit: "100",
      });

      const response = await fetch(
        `${API_URL}/api/pengguna?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(result.message, "Gagal mengambil data pengguna."),
        );
      }

      setUserList(Array.isArray(result.data) ? result.data : []);

      setTotalUsers(result.pagination?.total ?? 0);
    } catch (err) {
      setError(
        err.message || "Terjadi kesalahan saat mengambil data pengguna.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filterStatus, handleUnauthorized]);

  // Mengambil statistik pengguna
  const fetchStatistics = useCallback(async () => {
    try {
      setLoadingStatistics(true);

      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(`${API_URL}/api/pengguna/statistics`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(
            result.message,
            "Gagal mengambil statistik pengguna.",
          ),
        );
      }

      setStatistics({
        total_pengguna: Number(result.data.total_pengguna) || 0,
        total_admin: Number(result.data.total_admin) || 0,
        total_superadmin: Number(result.data.total_superadmin) || 0,
        total_aktif: Number(result.data.total_aktif) || 0,
      });
    } catch (err) {
      console.error("Statistik pengguna:", err);
    } finally {
      setLoadingStatistics(false);
    }
  }, [handleUnauthorized]);

  // Memuat data ketika halaman dibuka atau filter berubah
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Memuat statistik ketika halaman dibuka
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Memuat ulang seluruh data
  async function handleRefresh() {
    setNotice("");
    setError("");

    await Promise.all([fetchUsers(), fetchStatistics()]);
  }

  // Mengubah status akun
  async function handleStatusChange(user) {
    const newStatus = user.status_akun === "aktif" ? "nonaktif" : "aktif";

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin mengubah status akun ${user.nama_lengkap} menjadi ${newStatus}?`,
    );

    if (!confirmed) return;

    try {
      setProcessingId(user.id_pengguna);
      setError("");
      setNotice("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/pengguna/${user.id_pengguna}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status_akun: newStatus,
          }),
        },
      );

      const result = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(result.message, "Gagal mengubah status akun."),
        );
      }

      setNotice(result.message || "Status akun berhasil diperbarui.");

      await Promise.all([fetchUsers(), fetchStatistics()]);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat mengubah status.");
    } finally {
      setProcessingId(null);
    }
  }

  // Reset password pengguna
  async function handleResetPassword(user) {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin mereset password ${user.nama_lengkap}?\n\nPassword akan dikembalikan menjadi password default: Psn@2026Awal`,
    );

    if (!confirmed) return;

    try {
      setProcessingId(user.id_pengguna);
      setError("");
      setNotice("");

      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(
        `${API_URL}/api/pengguna/${user.id_pengguna}/reset-password`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(result.message, "Gagal mereset password pengguna."),
        );
      }

      setNotice(
        result.message || `Password ${user.nama_lengkap} berhasil direset.`,
      );
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat mereset password.");
    } finally {
      setProcessingId(null);
    }
  }

  // Menghapus akun pengguna
  async function handleDelete(user) {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus akun ${user.nama_lengkap}? Tindakan ini tidak dapat dibatalkan.`,
    );

    if (!confirmed) return;

    try {
      setProcessingId(user.id_pengguna);
      setError("");
      setNotice("");

      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/pengguna/${user.id_pengguna}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const result = await response.json();

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          getErrorMessage(result.message, "Gagal menghapus pengguna."),
        );
      }

      setNotice(result.message || "Pengguna berhasil dihapus.");

      await Promise.all([fetchUsers(), fetchStatistics()]);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat menghapus pengguna.");
    } finally {
      setProcessingId(null);
    }
  }

  // Label role
  function getRoleLabel(role) {
    const labels = {
      admin: "Admin Kelurahan",
      superadmin: "Superadmin",
    };

    return labels[role] || role;
  }

  // Label status
  function getStatusLabel(status) {
    const labels = {
      aktif: "Aktif",
      nonaktif: "Nonaktif",
      diblokir: "Diblokir",
    };

    return labels[status] || status;
  }

  return (
    <div className="data-pengguna">
      {/* Header */}
      <div className="pengguna-header">
        <div>
          <h1>Data Pengguna</h1>
          <p>
            Kelola akun pengguna yang memiliki akses ke sistem Monitoring PSN
            dan Jumantik.
          </p>
        </div>

        <button
          className="btn-tambah-pengguna"
          onClick={() => navigate("/superadmin/pengguna/tambah")}
        >
          <Plus size={18} />
          Tambah Pengguna
        </button>
      </div>

      {/* Statistik */}
      <div className="pengguna-statistik">
        <div className="pengguna-statistik-card">
          <div className="pengguna-statistik-icon blue">
            <Users size={22} />
          </div>

          <div>
            <span>Total Pengguna</span>
            <h2>{loadingStatistics ? "..." : statistics.total_pengguna}</h2>
          </div>
        </div>

        <div className="pengguna-statistik-card">
          <div className="pengguna-statistik-icon purple">
            <UserCog size={22} />
          </div>

          <div>
            <span>Admin Kelurahan</span>
            <h2>{loadingStatistics ? "..." : statistics.total_admin}</h2>
          </div>
        </div>

        <div className="pengguna-statistik-card">
          <div className="pengguna-statistik-icon orange">
            <ShieldCheck size={22} />
          </div>

          <div>
            <span>Superadmin</span>
            <h2>{loadingStatistics ? "..." : statistics.total_superadmin}</h2>
          </div>
        </div>

        <div className="pengguna-statistik-card">
          <div className="pengguna-statistik-icon green">
            <UserRound size={22} />
          </div>

          <div>
            <span>Akun Aktif</span>
            <h2>{loadingStatistics ? "..." : statistics.total_aktif}</h2>
          </div>
        </div>
      </div>

      {/* Tabel Pengguna */}
      <div className="pengguna-table-container">
        {/* Header tabel */}
        <div className="pengguna-table-header">
          <div>
            <h2>Daftar Pengguna</h2>
            <p>Daftar akun Admin Kelurahan dan Superadmin.</p>
          </div>

          <button
            className="btn-refresh-pengguna"
            onClick={handleRefresh}
            disabled={loading || loadingStatistics}
            title="Muat ulang data"
          >
            <RefreshCw
              size={17}
              className={loading ? "refresh-spinning" : ""}
            />
          </button>
        </div>

        {/* Notifikasi sukses */}
        {notice && (
          <div className="pengguna-notice">
            <span>{notice}</span>

            <button onClick={() => setNotice("")}>×</button>
          </div>
        )}

        {/* Notifikasi error */}
        {error && (
          <div className="pengguna-error">
            <span>{error}</span>

            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {/* Filter */}
        <div className="pengguna-filter">
          <div className="pengguna-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Cari nama, email, atau nomor telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">Semua Role</option>
            <option value="admin">Admin Kelurahan</option>
            <option value="superadmin">Superadmin</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
            <option value="diblokir">Diblokir</option>
          </select>
        </div>

        {/* Tabel */}
        <div className="pengguna-table-wrapper">
          <table className="pengguna-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nama Pengguna</th>
                <th>Email</th>
                <th>Nomor Telepon</th>
                <th>Jabatan</th>
                <th>Role</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="pengguna-empty">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : userList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="pengguna-empty">
                    Tidak ada data pengguna yang ditemukan.
                  </td>
                </tr>
              ) : (
                userList.map((user, index) => (
                  <tr key={user.id_pengguna}>
                    <td>{index + 1}</td>

                    <td>
                      <div className="pengguna-name">
                        <div className="pengguna-avatar">
                          <UserRound size={17} />
                        </div>

                        <strong>{user.nama_lengkap}</strong>
                      </div>
                    </td>

                    <td>{user.email}</td>

                    <td>{user.no_hp || "-"}</td>

                    <td>{user.jabatan || "-"}</td>

                    <td>
                      <span className={`pengguna-role ${user.role}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>

                    <td>
                      <span className={`pengguna-status ${user.status_akun}`}>
                        {getStatusLabel(user.status_akun)}
                      </span>
                    </td>

                    <td>
                      <div className="pengguna-actions">
                        {/* Edit */}
                        <button
                          className="pengguna-action-edit"
                          title="Edit pengguna"
                          disabled={processingId === user.id_pengguna}
                          onClick={() =>
                            navigate(`/superadmin/pengguna/${user.id_pengguna}/edit`)
                          }
                        >
                          <Pencil size={16} />
                        </button>

                        {/* Reset Password */}
                        <button
                          className="pengguna-action-reset"
                          title="Reset password"
                          disabled={processingId === user.id_pengguna}
                          onClick={() => handleResetPassword(user)}
                        >
                          <KeyRound size={16} />
                        </button>

                        {/* Ubah status */}
                        <button
                          className="pengguna-action-status"
                          title="Ubah status"
                          disabled={processingId === user.id_pengguna}
                          onClick={() => handleStatusChange(user)}
                        >
                          <RefreshCw size={16} />
                        </button>

                        {/* Hapus */}
                        <button
                          className="pengguna-action-delete"
                          title="Hapus pengguna"
                          disabled={processingId === user.id_pengguna}
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer tabel */}
        <div className="pengguna-table-footer">
          Menampilkan {userList.length} dari {totalUsers} pengguna
        </div>
      </div>
    </div>
  );
}

export default DataPengguna;
