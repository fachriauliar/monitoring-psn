const { query } = require("../config/database");

const baseStatsSql = `
  SELECT
    (SELECT COUNT(*)::int FROM wilayah_rw) AS jumlah_rw,
    (SELECT COUNT(*)::int FROM wilayah_rt) AS jumlah_rt,
    (SELECT COUNT(*)::int FROM kader_jumantik WHERE status_kader='aktif') AS jumlah_kader,
    COALESCE(SUM(jumlah_rumah_diperiksa),0)::int AS rumah_diperiksa,
    COALESCE(SUM(jumlah_rumah_positif),0)::int AS rumah_positif,
    COALESCE(SUM(jumlah_rumah_bebas),0)::int AS rumah_bebas,
    COUNT(*) FILTER (WHERE status_validasi='belum_diperiksa')::int AS laporan_belum_diperiksa,
    COUNT(*) FILTER (WHERE status_validasi='valid')::int AS laporan_valid,
    COUNT(*) FILTER (WHERE status_validasi='perlu_perbaikan')::int AS laporan_perlu_perbaikan,
    COUNT(*)::int AS jumlah_laporan
  FROM laporan_pemeriksaan
  WHERE ($1::date IS NULL OR tanggal_pelaksanaan >= $1)
    AND ($2::date IS NULL OR tanggal_pelaksanaan <= $2)
`;

async function getStats(from = null, to = null) {
  const result = await query(baseStatsSql, [from, to]);
  const row = result.rows[0];
  const examined = Number(row.rumah_diperiksa);
  const free = Number(row.rumah_bebas);
  return {
    ...row,
    abj: examined > 0 ? Number(((free / examined) * 100).toFixed(2)) : 0,
  };
}

async function getPublicDashboard(req, res, next) {
  try {
    const stats = await getStats();
    const monthly = await query(
      `SELECT TO_CHAR(DATE_TRUNC('month', tanggal_pelaksanaan), 'YYYY-MM') AS bulan,
              SUM(jumlah_rumah_diperiksa)::int AS rumah_diperiksa,
              SUM(jumlah_rumah_positif)::int AS rumah_positif,
              SUM(jumlah_rumah_bebas)::int AS rumah_bebas
       FROM laporan_pemeriksaan
       WHERE status_validasi='valid'
       GROUP BY DATE_TRUNC('month', tanggal_pelaksanaan)
       ORDER BY DATE_TRUNC('month', tanggal_pelaksanaan) DESC
       LIMIT 6`
    );
    const latest = await query(
      `SELECT l.tanggal_pelaksanaan, rw.nama_rw, rt.nama_rt,
              l.jumlah_rumah_diperiksa, l.jumlah_rumah_positif,
              l.jumlah_rumah_bebas
       FROM laporan_pemeriksaan l
       LEFT JOIN wilayah_rt rt ON rt.id_wilayah_rt=l.id_wilayah_rt
       LEFT JOIN wilayah_rw rw ON rw.id_wilayah_rw=rt.id_wilayah_rw
       WHERE l.status_validasi='valid'
       ORDER BY l.tanggal_pelaksanaan DESC LIMIT 5`
    );

    return res.json({
      success: true,
      message: "Dashboard publik berhasil diambil.",
      data: { statistik: stats, tren_bulanan: monthly.rows, pemeriksaan_terbaru: latest.rows },
    });
  } catch (error) {
    next(error);
  }
}

async function getAdminDashboard(req, res, next) {
  try {
    const stats = await getStats();
    const latest = await query(
      `SELECT l.id_laporan, l.tanggal_pelaksanaan, rw.nama_rw, rt.nama_rt,
              l.nama_kader, l.jumlah_rumah_diperiksa, l.jumlah_rumah_positif,
              l.jumlah_rumah_bebas, l.status_validasi
       FROM laporan_pemeriksaan l
       LEFT JOIN wilayah_rt rt ON rt.id_wilayah_rt=l.id_wilayah_rt
       LEFT JOIN wilayah_rw rw ON rw.id_wilayah_rw=rt.id_wilayah_rw
       ORDER BY l.created_at DESC LIMIT 8`
    );
    const byRw = await query(
      `SELECT rw.id_wilayah_rw, rw.nama_rw,
              COALESCE(SUM(l.jumlah_rumah_diperiksa),0)::int AS rumah_diperiksa,
              COALESCE(SUM(l.jumlah_rumah_positif),0)::int AS rumah_positif,
              COALESCE(SUM(l.jumlah_rumah_bebas),0)::int AS rumah_bebas,
              CASE WHEN COALESCE(SUM(l.jumlah_rumah_diperiksa),0)=0 THEN 0
                   ELSE ROUND(COALESCE(SUM(l.jumlah_rumah_bebas),0)::numeric /
                         SUM(l.jumlah_rumah_diperiksa)::numeric * 100, 2) END AS abj
       FROM wilayah_rw rw
       LEFT JOIN wilayah_rt rt ON rt.id_wilayah_rw=rw.id_wilayah_rw
       LEFT JOIN laporan_pemeriksaan l ON l.id_wilayah_rt=rt.id_wilayah_rt
       GROUP BY rw.id_wilayah_rw, rw.nama_rw
       ORDER BY rw.nomor_rw`
    );

    return res.json({
      success: true,
      message: "Dashboard Admin berhasil diambil.",
      data: { statistik: stats, laporan_terbaru: latest.rows, statistik_per_rw: byRw.rows },
    });
  } catch (error) {
    next(error);
  }
}

async function getKasieDashboard(req, res, next) {
  try {
    const stats = await getStats();
    const users = await query(
      `SELECT COUNT(*)::int AS total_pengguna,
              COUNT(*) FILTER (WHERE role='admin')::int AS jumlah_admin,
              COUNT(*) FILTER (WHERE role='kasie')::int AS jumlah_kasie
       FROM pengguna WHERE status_akun='aktif'`
    );
    const latest = await query(
      `SELECT l.id_laporan, l.tanggal_pelaksanaan, rw.nama_rw, rt.nama_rt,
              l.nama_kader, l.jumlah_rumah_diperiksa, l.jumlah_rumah_positif,
              l.jumlah_rumah_bebas, l.status_validasi
       FROM laporan_pemeriksaan l
       LEFT JOIN wilayah_rt rt ON rt.id_wilayah_rt=l.id_wilayah_rt
       LEFT JOIN wilayah_rw rw ON rw.id_wilayah_rw=rt.id_wilayah_rw
       ORDER BY l.created_at DESC LIMIT 10`
    );
    const monthly = await query(
      `SELECT TO_CHAR(DATE_TRUNC('month', tanggal_pelaksanaan), 'YYYY-MM') AS bulan,
              SUM(jumlah_rumah_diperiksa)::int AS rumah_diperiksa,
              SUM(jumlah_rumah_positif)::int AS rumah_positif,
              SUM(jumlah_rumah_bebas)::int AS rumah_bebas
       FROM laporan_pemeriksaan
       GROUP BY DATE_TRUNC('month', tanggal_pelaksanaan)
       ORDER BY DATE_TRUNC('month', tanggal_pelaksanaan) DESC LIMIT 6`
    );

    return res.json({
      success: true,
      message: "Dashboard Kasie berhasil diambil.",
      data: {
        statistik: stats,
        pengguna_aktif: users.rows[0],
        laporan_terbaru: latest.rows,
        tren_bulanan: monthly.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getPublicDashboard, getAdminDashboard, getKasieDashboard };
