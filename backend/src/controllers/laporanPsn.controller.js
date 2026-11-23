const { pool, query } = require("../config/database");
const { getSheetData } = require("../config/googleSheets");

const COLUMN_COUNT = 27;

// Mengubah nilai menjadi angka.
function parseNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const cleaned = String(value)
    .replace(/%/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : 0;
}

// Mengubah tanggal Google Sheets menjadi YYYY-MM-DD.
function parseDate(value) {
  if (!value) return null;

  const dateString = String(value).trim();

  // Format YYYY-MM-DD.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Format DD/MM/YYYY atau DD-MM-YYYY.
  const match = dateString.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return [
      year,
      String(month).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");
  }

  return null;
}

// Memastikan baris tidak kosong.
function isEmptyRow(row) {
  return !row.some((value) => String(value ?? "").trim() !== "");
}

// Mengubah satu baris Google Sheets menjadi data database.
function mapSheetRow(row, headers, sourceRow) {
  const values = Array.from(
    { length: COLUMN_COUNT },
    (_, index) => row[index] ?? "",
  );

  const rawData = headers.map((header, index) => ({
    header: header || `Kolom ${index + 1}`,
    value: values[index],
  }));

  const totalDikunjungi = parseNumber(values[21]);
  const totalJentik = parseNumber(values[22]);
  const totalKontainer = parseNumber(values[23]);
  const abj = parseNumber(values[24]);

  const date = parseDate(values[3]);

  return {
    source_row: sourceRow,

    kode_laporan: `PSN-${String(sourceRow).padStart(5, "0")}`,

    tanggal_pelaksanaan: date,

    wilayah_rw: String(values[4] || "").trim(),

    // Kolom sumber bernama Nama Koordinator Jumantik.
    // Disimpan di kolom nama_kader untuk mengikuti struktur tabel saat ini.
    nama_kader: String(values[1] || "").trim(),

    jumlah_dikunjungi: totalDikunjungi,
    jumlah_jentik: totalJentik,
    jumlah_kontainer: totalKontainer,

    abj: values[24] === "" ? null : abj,

    raw_data: rawData,
  };
}

// GET /api/laporan-psn
async function getLaporanPsn(req, res, next) {
  try {
    const result = await query(
      `SELECT
        id,
        spreadsheet_id,
        source_row,
        kode_laporan,
        tanggal_pelaksanaan,
        wilayah_rw,
        nama_kader,
        jumlah_dikunjungi,
        jumlah_jentik,
        jumlah_kontainer,
        abj,
        raw_data,
        sync_at
       FROM laporan_psn_sheet
       ORDER BY source_row DESC`,
    );

    return res.json({
      success: true,
      message: "Data pemeriksaan PSN berhasil diambil.",
      data: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/laporan-psn/sync
async function syncLaporanPsn(req, res, next) {
  const client = await pool.connect();

  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    if (!spreadsheetId) {
      return res.status(500).json({
        success: false,
        message: "GOOGLE_SHEETS_ID belum dikonfigurasi.",
      });
    }

    // Mengambil seluruh isi Google Sheets.
    const sheetData = await getSheetData();

    if (!sheetData.length) {
      return res.status(400).json({
        success: false,
        message: "Google Sheets tidak memiliki data.",
      });
    }

    const headers = sheetData[0];

    if (headers.length < COLUMN_COUNT) {
      return res.status(400).json({
        success: false,
        message: `Jumlah kolom Google Sheets tidak sesuai. Minimal ${COLUMN_COUNT} kolom diperlukan.`,
      });
    }

    const rows = sheetData.slice(1);

    let berhasilDisimpan = 0;
    let dilewati = 0;

    await client.query("BEGIN");

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];

      if (isEmptyRow(row)) {
        dilewati++;
        continue;
      }

      // Header ada di baris 1, data pertama ada di baris 2.
      const sourceRow = index + 2;

      const data = mapSheetRow(row, headers, sourceRow);

      await client.query(
        `INSERT INTO laporan_psn_sheet (
          spreadsheet_id,
          source_row,
          kode_laporan,
          tanggal_pelaksanaan,
          wilayah_rw,
          nama_kader,
          jumlah_dikunjungi,
          jumlah_jentik,
          jumlah_kontainer,
          abj,
          raw_data,
          sync_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11::jsonb,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (spreadsheet_id, source_row)
        DO UPDATE SET
          kode_laporan = EXCLUDED.kode_laporan,
          tanggal_pelaksanaan = EXCLUDED.tanggal_pelaksanaan,
          wilayah_rw = EXCLUDED.wilayah_rw,
          nama_kader = EXCLUDED.nama_kader,
          jumlah_dikunjungi = EXCLUDED.jumlah_dikunjungi,
          jumlah_jentik = EXCLUDED.jumlah_jentik,
          jumlah_kontainer = EXCLUDED.jumlah_kontainer,
          abj = EXCLUDED.abj,
          raw_data = EXCLUDED.raw_data,
          sync_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP`,
        [
          spreadsheetId,
          data.source_row,
          data.kode_laporan,
          data.tanggal_pelaksanaan,
          data.wilayah_rw,
          data.nama_kader,
          data.jumlah_dikunjungi,
          data.jumlah_jentik,
          data.jumlah_kontainer,
          data.abj,
          JSON.stringify(data.raw_data),
        ],
      );

      berhasilDisimpan++;
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Sinkronisasi Google Sheets berhasil.",
      data: {
        total_dibaca: rows.length,
        berhasil_disimpan: berhasilDisimpan,
        dilewati,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}

module.exports = {
  getLaporanPsn,
  syncLaporanPsn,
};
