const { query } = require("../config/database");

// =========================================================
// STATISTIK UTAMA
// Data perhitungan pemeriksaan hanya menggunakan laporan valid.
// =========================================================

async function getStats() {
  const result = await query(`
    SELECT
      (
        SELECT COUNT(*)::int
        FROM wilayah_rw
      ) AS jumlah_rw,

      (
        SELECT COUNT(*)::int
        FROM kader_jumantik
        WHERE status_kader = 'aktif'
      ) AS jumlah_kader,

      COUNT(*) FILTER (
        WHERE status_validasi = 'valid'
      )::int AS jumlah_laporan_valid,

      COUNT(*)::int AS jumlah_laporan,

      COUNT(*) FILTER (
        WHERE status_validasi = 'belum_diperiksa'
      )::int AS laporan_belum_diperiksa,

      COUNT(*) FILTER (
        WHERE status_validasi = 'perlu_perbaikan'
      )::int AS laporan_perlu_perbaikan,

      COALESCE(
        SUM(jumlah_dikunjungi_seluruhnya)
          FILTER (WHERE status_validasi = 'valid'),
        0
      )::int AS jumlah_lokasi_dikunjungi,

      COALESCE(
        SUM(jumlah_jentik_seluruhnya)
          FILTER (WHERE status_validasi = 'valid'),
        0
      )::int AS jumlah_jentik,

      COALESCE(
        SUM(jumlah_kontainer_diperiksa)
          FILTER (WHERE status_validasi = 'valid'),
        0
      )::int AS jumlah_kontainer_diperiksa,

      COALESCE(
        AVG(abj_persen)
          FILTER (WHERE status_validasi = 'valid'),
        0
      )::numeric(5,2) AS rata_rata_abj

    FROM laporan_pemeriksaan
  `);

  return result.rows[0];
}

// =========================================================
// STATISTIK PUBLIK
// Hanya menampilkan informasi yang sudah tervalidasi.
// =========================================================

function getPublicStats(stats) {
  return {
    jumlah_rw: stats.jumlah_rw,
    jumlah_kader: stats.jumlah_kader,
    jumlah_laporan: stats.jumlah_laporan_valid,
    jumlah_lokasi_dikunjungi: stats.jumlah_lokasi_dikunjungi,
    jumlah_jentik: stats.jumlah_jentik,
    jumlah_kontainer_diperiksa: stats.jumlah_kontainer_diperiksa,
    rata_rata_abj: stats.rata_rata_abj,
  };
}

// =========================================================
// DASHBOARD PUBLIK
// GET /api/dashboard/public
// =========================================================

async function getPublicDashboard(req, res, next) {
  try {
    const stats = await getStats();

    // Enam bulan terakhir, diurutkan dari lama ke baru.
    const monthly = await query(`
      SELECT *
      FROM (
        SELECT
          DATE_TRUNC(
            'month',
            tanggal_pelaksanaan
          ) AS periode,

          TO_CHAR(
            DATE_TRUNC('month', tanggal_pelaksanaan),
            'YYYY-MM'
          ) AS bulan,

          SUM(
            jumlah_dikunjungi_seluruhnya
          )::int AS jumlah_dikunjungi,

          SUM(
            jumlah_jentik_seluruhnya
          )::int AS jumlah_jentik,

          AVG(abj_persen)::numeric(5,2) AS rata_rata_abj

        FROM laporan_pemeriksaan

        WHERE status_validasi = 'valid'
          AND tanggal_pelaksanaan IS NOT NULL

        GROUP BY DATE_TRUNC(
          'month',
          tanggal_pelaksanaan
        )

        ORDER BY periode DESC
        LIMIT 6
      ) AS data_bulanan

      ORDER BY periode ASC
    `);

    // Lima laporan valid terbaru.
    const latest = await query(`
      SELECT
        l.kode_laporan,
        l.tanggal_pelaksanaan,
        rw.nama_rw,
        l.jumlah_dikunjungi_seluruhnya,
        l.jumlah_jentik_seluruhnya,
        l.abj_persen

      FROM laporan_pemeriksaan l

      LEFT JOIN wilayah_rw rw
        ON rw.id_wilayah_rw = l.id_wilayah_rw

      WHERE l.status_validasi = 'valid'

      ORDER BY
        l.tanggal_pelaksanaan DESC,
        l.created_at DESC

      LIMIT 5
    `);

    return res.json({
      success: true,
      message: "Dashboard publik berhasil diambil.",
      data: {
        statistik: getPublicStats(stats),
        tren_bulanan: monthly.rows,
        pemeriksaan_terbaru: latest.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

// =========================================================
// DASHBOARD ADMIN DAN SUPERADMIN
// GET /api/dashboard/admin
// =========================================================

async function getAdminDashboard(req, res, next) {
  try {
    const stats = await getStats();

    // Delapan laporan terbaru dari seluruh status.
    const latest = await query(`
      SELECT
        l.id_laporan,
        l.kode_laporan,
        l.tanggal_pelaksanaan,
        rw.nama_rw,
        l.nama_koordinator,
        l.jumlah_dikunjungi_seluruhnya,
        l.jumlah_jentik_seluruhnya,
        l.jumlah_kontainer_diperiksa,
        l.abj_persen,
        l.status_validasi

      FROM laporan_pemeriksaan l

      LEFT JOIN wilayah_rw rw
        ON rw.id_wilayah_rw = l.id_wilayah_rw

      ORDER BY l.created_at DESC

      LIMIT 8
    `);

    // Rekap laporan dan pemeriksaan per RW.
    const byRw = await query(`
      SELECT
        rw.id_wilayah_rw,
        rw.nomor_rw,
        rw.nama_rw,

        COUNT(l.id_laporan)::int AS jumlah_laporan,

        COUNT(l.id_laporan) FILTER (
          WHERE l.status_validasi = 'valid'
        )::int AS jumlah_laporan_valid,

        COUNT(l.id_laporan) FILTER (
          WHERE l.status_validasi = 'belum_diperiksa'
        )::int AS laporan_belum_diperiksa,

        COUNT(l.id_laporan) FILTER (
          WHERE l.status_validasi = 'perlu_perbaikan'
        )::int AS laporan_perlu_perbaikan,

        COALESCE(
          SUM(l.jumlah_dikunjungi_seluruhnya)
            FILTER (WHERE l.status_validasi = 'valid'),
          0
        )::int AS jumlah_dikunjungi,

        COALESCE(
          SUM(l.jumlah_jentik_seluruhnya)
            FILTER (WHERE l.status_validasi = 'valid'),
          0
        )::int AS jumlah_jentik,

        COALESCE(
          SUM(l.jumlah_kontainer_diperiksa)
            FILTER (WHERE l.status_validasi = 'valid'),
          0
        )::int AS jumlah_kontainer_diperiksa,

        COALESCE(
          AVG(l.abj_persen)
            FILTER (WHERE l.status_validasi = 'valid'),
          0
        )::numeric(5,2) AS rata_rata_abj

      FROM wilayah_rw rw

      LEFT JOIN laporan_pemeriksaan l
        ON l.id_wilayah_rw = rw.id_wilayah_rw

      GROUP BY
        rw.id_wilayah_rw,
        rw.nomor_rw,
        rw.nama_rw

      ORDER BY rw.nomor_rw
    `);

    return res.json({
      success: true,
      message: "Dashboard Admin berhasil diambil.",
      data: {
        statistik: stats,
        laporan_terbaru: latest.rows,
        statistik_per_rw: byRw.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPublicDashboard,
  getAdminDashboard,
};
