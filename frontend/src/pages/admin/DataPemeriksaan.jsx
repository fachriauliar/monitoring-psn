import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  RefreshCw,
  FileSpreadsheet,
  ClipboardList,
  ExternalLink,
  X,
} from "lucide-react";

import { apiRequest } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

import "../../assets/styles/DataPemeriksaan.css";

// =======================================================
// KONFIGURASI KOLOM GOOGLE SHEETS
// =======================================================

const COLUMNS = [
  "Timestamp",
  "Nama Kader Jumantik",
  "Nomor HP",
  "Tanggal Pelaksanaan PSN",
  "Wilayah RW",
  "Jumlah RT yang diperiksa",
  "Jumlah Jumantik yang melapor",
  "Jumlah Rumah Tangga yang dikunjungi",
  "Jumlah jentik yang ditemukan",
  "Jumlah Perkantoran yang dikunjungi",
  "Jumlah jentik yang ditemukan",
  "Jumlah Sarana Pendidikan yang dikunjungi",
  "Jumlah jentik yang ditemukan",
  "Jumlah Tempat Umum yang dikunjungi",
  "Jumlah jentik yang ditemukan",
  "Jumlah Tempat Olahraga yang dikunjungi",
  "Jumlah jentik yang ditemukan",
  "Jumlah Tempat Pengelolaan Makanan yang dikunjungi",
  "Jumlah jentik yang ditemukan",
  "Jumlah Sarana Kesehatan yang dikunjungi",
  "Jumlah jentik yang ditemukan",
  "Jumlah dikunjungi seluruhnya",
  "Jumlah Jentik seluruhnya",
  "Jumlah Kontener yang diperiksa",
  "Angka Bebas Jentik (ABJ%)",
  "Dokumentasi Kegiatan PSN",
  "Kendala di Lapangan",
];

const DOKUMENTASI_INDEX = 25;
const KENDALA_INDEX = 26;

// =======================================================
// KOMPONEN DATA PEMERIKSAAN
// =======================================================

function DataPemeriksaan() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [kendalaTerpilih, setKendalaTerpilih] = useState(null);

  // =======================================================
  // PENANGANAN SESI KEDALUWARSA
  // =======================================================

  const handleUnauthorized = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  // =======================================================
  // MENGAMBIL DATA LAPORAN PEMERIKSAAN
  // =======================================================

  const fetchLaporan = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await apiRequest("/api/laporan-psn");

      setLaporan(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      if (err.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(err.message || "Gagal mengambil data pemeriksaan.");
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  // Memuat data ketika halaman pertama kali dibuka.
  useEffect(() => {
    fetchLaporan();
  }, [fetchLaporan]);

  // =======================================================
  // SINKRONISASI GOOGLE SHEETS
  // =======================================================

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError("");
      setNotice("");

      const result = await apiRequest("/api/laporan-psn/sync", {
        method: "POST",
      });

      const data = result.data || {};

      setNotice(
        `${result.message} Total dibaca: ${
          data.total_dibaca ?? 0
        }, berhasil disimpan: ${
          data.berhasil_disimpan ?? 0
        }, dilewati: ${data.dilewati ?? 0}.`,
      );

      // Memuat ulang tabel setelah sinkronisasi berhasil.
      await fetchLaporan();
    } catch (err) {
      if (err.status === 401) {
        handleUnauthorized();
        return;
      }

      setError(err.message || "Gagal menghubungkan Google Sheets.");
    } finally {
      setSyncing(false);
    }
  };

  // =======================================================
  // MENGAMBIL NILAI SEL BERDASARKAN INDEX
  // =======================================================

  function getCellValue(item, index) {
    const value = item.raw_data?.[index]?.value;

    if (value === null || value === undefined || value === "") {
      return "-";
    }

    return value;
  }

  // =======================================================
  // MENAMPILKAN DOKUMENTASI GOOGLE DRIVE
  // =======================================================

  function renderDokumentasi(item) {
    const url = getCellValue(item, DOKUMENTASI_INDEX);

    if (url === "-") {
      return <span className="cell-empty">Tidak ada dokumentasi</span>;
    }

    const links = String(url)
      .split(/[\n,]+/)
      .map((link) => link.trim())
      .filter((link) => /^https?:\/\/\S+$/i.test(link));

    if (links.length === 0) {
      return <span className="cell-empty">Link tidak tersedia</span>;
    }

    return (
      <div className="dokumentasi-cell">
        {links.map((link, index) => (
          <a
            key={`${item.id ?? "laporan"}-${link}-${index}`}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-dokumentasi"
            title="Buka dokumentasi Google Drive"
          >
            <ExternalLink size={14} />

            {links.length > 1
              ? `Dokumentasi ${index + 1}`
              : "Lihat Dokumentasi"}
          </a>
        ))}
      </div>
    );
  }

  // =======================================================
  // MENAMPILKAN KENDALA DI LAPANGAN
  // =======================================================

  function renderKendala(item) {
    const kendala = getCellValue(item, KENDALA_INDEX);

    if (kendala === "-") {
      return <span className="cell-empty">Tidak ada kendala</span>;
    }

    const teks = String(kendala);
    const batasKarakter = 100;
    const terlaluPanjang = teks.length > batasKarakter;

    return (
      <div className="kendala-cell">
        <span className="kendala-preview">
          {terlaluPanjang ? `${teks.slice(0, batasKarakter)}...` : teks}
        </span>

        {terlaluPanjang && (
          <button
            type="button"
            className="btn-kendala-detail"
            onClick={() =>
              setKendalaTerpilih({
                id: item.id,
                teks,
              })
            }
          >
            Lihat selengkapnya
          </button>
        )}
      </div>
    );
  }

  // =======================================================
  // MENENTUKAN TAMPILAN SETIAP SEL
  // =======================================================

  function renderCell(item, columnIndex) {
    if (columnIndex === DOKUMENTASI_INDEX) {
      return renderDokumentasi(item);
    }

    if (columnIndex === KENDALA_INDEX) {
      return renderKendala(item);
    }

    return getCellValue(item, columnIndex);
  }

  // =======================================================
  // TAMPILAN HALAMAN
  // =======================================================

  return (
    <div className="data-pemeriksaan">
      {/* HEADER */}
      <div className="pemeriksaan-header">
        <div className="pemeriksaan-header-icon">
          <ClipboardList size={32} />
        </div>

        <div>
          <h1>Data Pemeriksaan PSN</h1>

          <p>
            Data laporan pemeriksaan PSN yang terintegrasi dengan Google Sheets.
          </p>
        </div>
      </div>

      {/* CONTAINER DATA */}
      <div className="pemeriksaan-container">
        {/* HEADER TABEL */}
        <div className="pemeriksaan-top">
          <div>
            <h2>Daftar Laporan Pemeriksaan PSN</h2>

            <p>Data ditampilkan sesuai kolom pada Google Sheets.</p>
          </div>

          <div className="pemeriksaan-top-actions">
            {/* MUAT ULANG */}
            <button
              type="button"
              className="btn-refresh-sheet"
              onClick={fetchLaporan}
              disabled={loading || syncing}
              title="Muat ulang data"
              aria-label="Muat ulang data pemeriksaan"
            >
              <RefreshCw size={17} className={loading ? "sync-spinning" : ""} />
            </button>

            {/* SINKRONISASI */}
            <button
              type="button"
              className="btn-sync-sheet"
              onClick={handleSync}
              disabled={syncing || loading}
            >
              <RefreshCw size={17} className={syncing ? "sync-spinning" : ""} />

              {syncing ? "Menyinkronkan..." : "Sinkronkan Google Sheets"}
            </button>
          </div>
        </div>

        {/* NOTIFIKASI BERHASIL */}
        {notice && (
          <div className="pemeriksaan-notice">
            <FileSpreadsheet size={18} />

            <span>{notice}</span>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Tutup notifikasi"
            >
              ×
            </button>
          </div>
        )}

        {/* NOTIFIKASI ERROR */}
        {error && (
          <div className="pemeriksaan-error">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Tutup pesan kesalahan"
            >
              ×
            </button>
          </div>
        )}

        {/* TABEL */}
        <div className="pemeriksaan-table-wrapper">
          <table className="pemeriksaan-table">
            <thead>
              <tr>
                <th>No.</th>

                {COLUMNS.map((column, index) => (
                  <th key={`header-${index}`}>{column}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length + 1}
                    className="pemeriksaan-empty"
                  >
                    Memuat data pemeriksaan...
                  </td>
                </tr>
              ) : laporan.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length + 1}
                    className="pemeriksaan-empty"
                  >
                    Belum ada data pemeriksaan. Silakan sinkronkan Google
                    Sheets.
                  </td>
                </tr>
              ) : (
                laporan.map((item, rowIndex) => {
                  const rowKey =
                    item.id ?? item.id_raw ?? `laporan-${rowIndex}`;

                  return (
                    <tr key={rowKey}>
                      <td>{rowIndex + 1}</td>

                      {COLUMNS.map((column, columnIndex) => (
                        <td
                          key={`cell-${columnIndex}`}
                          className={
                            columnIndex === DOKUMENTASI_INDEX
                              ? "td-dokumentasi"
                              : columnIndex === KENDALA_INDEX
                                ? "td-kendala"
                                : ""
                          }
                        >
                          {renderCell(item, columnIndex)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER TABEL */}
        <div className="pemeriksaan-footer">
          Menampilkan {laporan.length} laporan pemeriksaan
        </div>
      </div>

      {/* MODAL DETAIL KENDALA */}
      {kendalaTerpilih && (
        <div
          className="kendala-modal-overlay"
          onClick={() => setKendalaTerpilih(null)}
        >
          <div
            className="kendala-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="kendala-modal-header">
              <div>
                <h3>Kendala di Lapangan</h3>

                <p>Detail kendala pemeriksaan PSN</p>
              </div>

              <button
                type="button"
                className="kendala-modal-close"
                onClick={() => setKendalaTerpilih(null)}
                aria-label="Tutup modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="kendala-modal-content">{kendalaTerpilih.teks}</div>

            <div className="kendala-modal-footer">
              <button type="button" onClick={() => setKendalaTerpilih(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataPemeriksaan;
