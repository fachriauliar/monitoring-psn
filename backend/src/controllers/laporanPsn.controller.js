const crypto = require("crypto");
const { pool } = require("../config/database");
const { getSheetData } = require("../config/googleSheets");

const COLUMN_COUNT = 27;

// Mengubah nilai jumlah menjadi integer.
function parseCount(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const cleanedValue = String(value)
    .trim()
    .replace(/\s+/g, "")
    .replace(/rt|orang/gi, "")
    .replace(/[^\d]/g, "");

  const result = Number(cleanedValue);

  return Number.isFinite(result) ? result : 0;
}

// Mengubah nilai ABJ menjadi angka desimal.
function parsePercentage(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  let cleaned = String(value).trim().replace(/%/g, "").replace(/\s/g, "");

  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }

  const number = Number(cleaned);

  if (!Number.isFinite(number) || number < 0 || number > 100) {
    return null;
  }

  return Number(number.toFixed(2));
}

// Memvalidasi tanggal dan mengubahnya menjadi YYYY-MM-DD.
function buildDate(year, month, day) {
  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(day) ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

// Mengubah berbagai format tanggal menjadi YYYY-MM-DD.
function parseDate(value) {
  if (!value) return null;

  const dateString = String(value).trim();

  if (!dateString) return null;

  // Koreksi khusus tanggal yang salah input di Google Sheets.
  const corrections = {
    "10/23/2926": "2026-10-23",
    "6/12/0026": "2026-06-12",
  };

  if (corrections[dateString]) {
    return corrections[dateString];
  }

  // Format ISO: YYYY-MM-DD.
  const isoMatch = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);

    return buildDate(year, month, day);
  }

  // Format tanggal Indonesia: 29 Mei 2026.
  const monthNames = {
    januari: 1,
    jan: 1,
    februari: 2,
    feb: 2,
    maret: 3,
    mar: 3,
    april: 4,
    apr: 4,
    mei: 5,
    may: 5,
    juni: 6,
    jun: 6,
    juli: 7,
    jul: 7,
    agustus: 8,
    agu: 8,
    agt: 8,
    september: 9,
    sep: 9,
    oktober: 10,
    okt: 10,
    oct: 10,
    november: 11,
    nov: 11,
    desember: 12,
    des: 12,
    dec: 12,
  };

  const indoMatch = dateString.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{2,4})$/i);

  if (indoMatch) {
    const day = Number(indoMatch[1]);
    const month = monthNames[indoMatch[2].toLowerCase()];
    let year = Number(indoMatch[3]);

    if (year < 100) {
      year += 2000;
    }

    return buildDate(year, month, day);
  }

  // Format angka Google Sheets: M/D/YYYY atau D/M/YYYY.
  const numericMatch = dateString.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/,
  );

  if (numericMatch) {
    const first = Number(numericMatch[1]);
    const second = Number(numericMatch[2]);
    let year = Number(numericMatch[3]);

    if (year < 100) {
      year += 2000;
    }

    let month;
    let day;

    // Jika angka pertama lebih dari 12, gunakan DD/MM/YYYY.
    if (first > 12) {
      day = first;
      month = second;
    } else {
      // Default Google Sheets adalah MM/DD/YYYY.
      month = first;
      day = second;
    }

    return buildDate(year, month, day);
  }

  return null;
}

// Mengubah tanggal menjadi DD/MM/YYYY untuk tampilan web.
function formatTanggalIndonesia(value) {
  if (!value) return "";

  const parsedDate = parseDate(value);

  if (!parsedDate) {
    return String(value);
  }

  const [year, month, day] = parsedDate.split("-");

  return `${day}/${month}/${year}`;
}

// Mengubah timestamp Google Sheets menjadi Date.
function parseTimestamp(value) {
  if (!value) return null;

  const timestamp = String(value).trim();

  if (!timestamp) return null;

  // Format ISO timestamp.
  if (/^\d{4}-\d{2}-\d{2}T/.test(timestamp)) {
    const date = new Date(timestamp);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Format YYYY-MM-DD HH:mm:ss.
  const isoMatch = timestamp.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const hour = Number(isoMatch[4] || 0);
    const minute = Number(isoMatch[5] || 0);
    const second = Number(isoMatch[6] || 0);

    return buildTimestamp(year, month, day, hour, minute, second);
  }

  // Format M/D/YYYY HH:mm:ss atau D/M/YYYY HH:mm:ss.
  const match = timestamp.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i,
  );

  if (!match) return null;

  const first = Number(match[1]);
  const second = Number(match[2]);
  const year = Number(match[3]);

  let hour = Number(match[4] || 0);
  const minute = Number(match[5] || 0);
  const secondValue = Number(match[6] || 0);

  const meridiem = match[7]?.toUpperCase();

  let day;
  let month;

  // Format utama Google Sheets adalah M/D/YYYY.
  if (first > 12) {
    day = first;
    month = second;
  } else {
    month = first;
    day = second;
  }

  if (meridiem === "PM" && hour < 12) {
    hour += 12;
  } else if (meridiem === "AM" && hour === 12) {
    hour = 0;
  }

  return buildTimestamp(year, month, day, hour, minute, secondValue);
}

// Memvalidasi tanggal dan waktu timestamp.
function buildTimestamp(year, month, day, hour, minute, second) {
  if (
    year < 2000 ||
    year > 2100 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return null;
  }

  const date = new Date(year, month - 1, day, hour, minute, second);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date.getSeconds() !== second
  ) {
    return null;
  }

  return date;
}

// Mengambil nomor RW dari nilai seperti RW 01, RW 1, atau 01.
function parseNomorRw(value) {
  const match = String(value || "").match(/\d+/);

  if (!match) return null;

  const nomor = Number(match[0]);

  return Number.isInteger(nomor) && nomor >= 1 && nomor <= 99 ? nomor : null;
}

// Memeriksa apakah baris Google Sheets kosong.
function isEmptyRow(row) {
  return !row.some((value) => String(value ?? "").trim() !== "");
}

// Membuat identitas stabil berdasarkan timestamp respons.
function createSourceId(timestampValue, row) {
  const identity = timestampValue
    ? `timestamp:${String(timestampValue).trim()}`
    : `row:${JSON.stringify(row)}`;

  return crypto.createHash("sha256").update(identity).digest("hex");
}

// Membuat kode laporan dari identitas sumber.
function createKodeLaporan(sourceId) {
  return `PSN-${sourceId.substring(0, 16).toUpperCase()}`;
}

// Memetakan baris Google Sheets menjadi data laporan.
function mapSheetRow(row, headers) {
  const values = Array.from(
    { length: COLUMN_COUNT },
    (_, index) => row[index] ?? "",
  );

  const rawData = headers.map((header, index) => ({
    header: header || `Kolom ${index + 1}`,
    value: values[index],
  }));

  const timestamp = parseTimestamp(values[0]);
  const tanggal = parseDate(values[3]);
  const nomorRw = parseNomorRw(values[4]);

  const sourceId = createSourceId(values[0], values);

  return {
    id_respons_sumber: sourceId,
    kode_laporan: createKodeLaporan(sourceId),

    timestamp_sumber: timestamp,
    timestamp_form: timestamp,

    tanggal_pelaksanaan: tanggal,
    nomor_rw: nomorRw,

    nama_koordinator: String(values[1] || "").trim(),
    no_hp_koordinator: String(values[2] || "").trim(),

    jumlah_rt_diperiksa: parseCount(values[5]),
    jumlah_jumantik_melapor: parseCount(values[6]),

    jumlah_rumah_tangga_dikunjungi: parseCount(values[7]),
    jumlah_jentik_rumah_tangga: parseCount(values[8]),

    jumlah_perkantoran_dikunjungi: parseCount(values[9]),
    jumlah_jentik_perkantoran: parseCount(values[10]),

    jumlah_pendidikan_dikunjungi: parseCount(values[11]),
    jumlah_jentik_pendidikan: parseCount(values[12]),

    jumlah_tempat_umum_dikunjungi: parseCount(values[13]),
    jumlah_jentik_tempat_umum: parseCount(values[14]),

    jumlah_tempat_olahraga_dikunjungi: parseCount(values[15]),
    jumlah_jentik_tempat_olahraga: parseCount(values[16]),

    jumlah_tpm_dikunjungi: parseCount(values[17]),
    jumlah_jentik_tpm: parseCount(values[18]),

    jumlah_kesehatan_dikunjungi: parseCount(values[19]),
    jumlah_jentik_kesehatan: parseCount(values[20]),

    jumlah_dikunjungi_seluruhnya: parseCount(values[21]),
    jumlah_jentik_seluruhnya: parseCount(values[22]),
    jumlah_kontainer_diperiksa: parseCount(values[23]),

    abj_persen: parsePercentage(values[24]),

    dokumentasi_kegiatan: String(values[25] || "").trim() || null,
    kendala_lapangan: String(values[26] || "").trim() || null,

    total_lokasi_positif: null,

    data_mentah: rawData,
  };
}

function formatPersentaseIndonesia(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  let cleanedValue = String(value)
    .trim()
    .toLowerCase()
    .replace(/persen|petsen/gi, "")
    .replace(/[%℅]/g, "")
    .replace(/\s+/g, "")
    .replace(/'/g, ".");

  // Samakan pemisah desimal menjadi titik.
  cleanedValue = cleanedValue.replace(",", ".");

  // Validasi angka.
  if (!/^\d+(\.\d+)?$/.test(cleanedValue)) {
    return String(value);
  }

  // Ubah titik desimal menjadi koma tanpa pembulatan.
  return `${cleanedValue.replace(".", ",")}%`;
}

// GET /api/laporan-psn
// Mengambil data langsung dari Google Sheets.

async function getLaporanPsn(req, res, next) {
  try {
    const sheetData = await getSheetData();

    if (!sheetData || sheetData.length === 0) {
      return res.json({
        success: true,
        message: "Google Sheets belum memiliki data.",
        headers: [],
        data: [],
        total: 0,
      });
    }

    const headers = sheetData[0];
    const rows = sheetData.slice(1);

    const data = rows
      .map((row, index) => ({
        nomor_baris: index + 2,
        raw_data: headers.map((header, columnIndex) => {
          let value = row[columnIndex] ?? "";

          const namaKolom = String(header || "")
            .trim()
            .toLowerCase();

          // Format Timestamp menjadi DD/MM/YYYY HH:mm:ss.
          if (columnIndex === 0 && value) {
            const match = String(value).match(
              /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/,
            );

            if (match) {
              const [, month, day, year, hour, minute, second] = match;

              value = `${day.padStart(2, "0")}/${month.padStart(
                2,
                "0",
              )}/${year} ${hour.padStart(2, "0")}:${minute}:${second}`;
            }
          }

          // Format Tanggal Pelaksanaan menjadi DD/MM/YYYY.
          if (columnIndex === 3 && value) {
            value = formatTanggalIndonesia(value);
          }

          // Format jumlah RT yang diperiksa.
          if (columnIndex === 5 && value) {
            value = `${parseCount(value)} RT`;
          }

          // Format jumlah Jumantik yang melapor.
          if (columnIndex === 6 && value) {
            value = `${parseCount(value)} Orang`;
          }

          // Format Angka Bebas Jentik (ABJ).
          if (namaKolom.includes("abj") && value) {
            value = formatPersentaseIndonesia(value);
          }

          return {
            header: header || `Kolom ${columnIndex + 1}`,
            value,
          };
        }),
      }))
      .filter((item) =>
        item.raw_data.some((column) => String(column.value).trim() !== ""),
      );

    return res.json({
      success: true,
      message: "Data pemeriksaan PSN berhasil diambil dari Google Sheets.",
      headers,
      data,
      total: data.length,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/laporan-psn/sync
// Menyinkronkan data Google Sheets ke PostgreSQL.
async function syncLaporanPsn(req, res, next) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

  if (!spreadsheetId) {
    return res.status(500).json({
      success: false,
      message: "GOOGLE_SHEETS_ID belum dikonfigurasi.",
    });
  }

  let client;

  try {
    const sheetData = await getSheetData();

    if (!sheetData || sheetData.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Google Sheets belum memiliki data respons.",
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
    let gagalDisimpan = 0;
    let dilewati = 0;

    const daftarError = [];

    client = await pool.connect();

    await client.query("BEGIN");

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];

      if (isEmptyRow(row)) {
        dilewati++;
        continue;
      }

      const data = mapSheetRow(row, headers);

      if (!data.timestamp_sumber) {
        gagalDisimpan++;

        daftarError.push({
          baris: index + 2,
          pesan: "Timestamp respons tidak valid.",
        });

        continue;
      }

      if (!data.tanggal_pelaksanaan) {
        gagalDisimpan++;

        daftarError.push({
          baris: index + 2,
          pesan: "Tanggal pelaksanaan tidak valid.",
        });

        continue;
      }

      if (!data.nomor_rw) {
        gagalDisimpan++;

        daftarError.push({
          baris: index + 2,
          pesan: "Wilayah RW tidak valid.",
        });

        continue;
      }

      const savepoint = `baris_${index + 2}`;

      await client.query(`SAVEPOINT ${savepoint}`);

      try {
        // Mencari data wilayah RW.
        const rwResult = await client.query(
          `SELECT id_wilayah_rw
           FROM wilayah_rw
           WHERE nomor_rw = $1`,
          [data.nomor_rw],
        );

        if (!rwResult.rowCount) {
          throw new Error(
            `Data RW ${data.nomor_rw} belum tersedia di tabel wilayah_rw.`,
          );
        }

        const idWilayahRw = rwResult.rows[0].id_wilayah_rw;

        // Menyimpan data mentah Google Sheets.
        const sheetResult = await client.query(
          `INSERT INTO laporan_psn_sheet (
            id_respons_sumber,
            timestamp_sumber,
            data_mentah,
            status_sinkronisasi,
            pesan_error,
            disinkronkan_at,
            updated_at
          )
          VALUES (
            $1, $2, $3::jsonb,
            'menunggu', NULL, NULL, NOW()
          )
          ON CONFLICT (id_respons_sumber)
          DO UPDATE SET
            timestamp_sumber = EXCLUDED.timestamp_sumber,
            data_mentah = EXCLUDED.data_mentah,
            status_sinkronisasi = 'menunggu',
            pesan_error = NULL,
            disinkronkan_at = NULL,
            updated_at = NOW()
          RETURNING id_sheet`,
          [
            data.id_respons_sumber,
            data.timestamp_sumber,
            JSON.stringify(data.data_mentah),
          ],
        );

        const idSheet = sheetResult.rows[0].id_sheet;

        // Menyimpan data laporan pemeriksaan.
        await client.query(
          `INSERT INTO laporan_pemeriksaan (
            kode_laporan,
            id_sheet,
            id_wilayah_rw,
            nama_koordinator,
            no_hp_koordinator,
            timestamp_form,
            tanggal_pelaksanaan,
            jumlah_rt_diperiksa,
            jumlah_jumantik_melapor,
            jumlah_rumah_tangga_dikunjungi,
            jumlah_jentik_rumah_tangga,
            jumlah_perkantoran_dikunjungi,
            jumlah_jentik_perkantoran,
            jumlah_pendidikan_dikunjungi,
            jumlah_jentik_pendidikan,
            jumlah_tempat_umum_dikunjungi,
            jumlah_jentik_tempat_umum,
            jumlah_tempat_olahraga_dikunjungi,
            jumlah_jentik_tempat_olahraga,
            jumlah_tpm_dikunjungi,
            jumlah_jentik_tpm,
            jumlah_kesehatan_dikunjungi,
            jumlah_jentik_kesehatan,
            jumlah_dikunjungi_seluruhnya,
            jumlah_jentik_seluruhnya,
            jumlah_kontainer_diperiksa,
            total_lokasi_positif,
            abj_persen,
            dokumentasi_kegiatan,
            kendala_lapangan
          )
          VALUES (
            $1, $2, $3,
            $4, $5, $6, $7,
            $8, $9,
            $10, $11,
            $12, $13,
            $14, $15,
            $16, $17,
            $18, $19,
            $20, $21,
            $22, $23,
            $24, $25, $26,
            $27, $28,
            $29, $30
          )
          ON CONFLICT (id_sheet)
          DO UPDATE SET
            kode_laporan = EXCLUDED.kode_laporan,
            id_wilayah_rw = EXCLUDED.id_wilayah_rw,
            nama_koordinator = EXCLUDED.nama_koordinator,
            no_hp_koordinator = EXCLUDED.no_hp_koordinator,
            timestamp_form = EXCLUDED.timestamp_form,
            tanggal_pelaksanaan = EXCLUDED.tanggal_pelaksanaan,
            jumlah_rt_diperiksa = EXCLUDED.jumlah_rt_diperiksa,
            jumlah_jumantik_melapor = EXCLUDED.jumlah_jumantik_melapor,
            jumlah_rumah_tangga_dikunjungi = EXCLUDED.jumlah_rumah_tangga_dikunjungi,
            jumlah_jentik_rumah_tangga = EXCLUDED.jumlah_jentik_rumah_tangga,
            jumlah_perkantoran_dikunjungi = EXCLUDED.jumlah_perkantoran_dikunjungi,
            jumlah_jentik_perkantoran = EXCLUDED.jumlah_jentik_perkantoran,
            jumlah_pendidikan_dikunjungi = EXCLUDED.jumlah_pendidikan_dikunjungi,
            jumlah_jentik_pendidikan = EXCLUDED.jumlah_jentik_pendidikan,
            jumlah_tempat_umum_dikunjungi = EXCLUDED.jumlah_tempat_umum_dikunjungi,
            jumlah_jentik_tempat_umum = EXCLUDED.jumlah_jentik_tempat_umum,
            jumlah_tempat_olahraga_dikunjungi = EXCLUDED.jumlah_tempat_olahraga_dikunjungi,
            jumlah_jentik_tempat_olahraga = EXCLUDED.jumlah_jentik_tempat_olahraga,
            jumlah_tpm_dikunjungi = EXCLUDED.jumlah_tpm_dikunjungi,
            jumlah_jentik_tpm = EXCLUDED.jumlah_jentik_tpm,
            jumlah_kesehatan_dikunjungi = EXCLUDED.jumlah_kesehatan_dikunjungi,
            jumlah_jentik_kesehatan = EXCLUDED.jumlah_jentik_kesehatan,
            jumlah_dikunjungi_seluruhnya = EXCLUDED.jumlah_dikunjungi_seluruhnya,
            jumlah_jentik_seluruhnya = EXCLUDED.jumlah_jentik_seluruhnya,
            jumlah_kontainer_diperiksa = EXCLUDED.jumlah_kontainer_diperiksa,
            abj_persen = EXCLUDED.abj_persen,
            dokumentasi_kegiatan = EXCLUDED.dokumentasi_kegiatan,
            kendala_lapangan = EXCLUDED.kendala_lapangan,
            updated_at = NOW()`,
          [
            data.kode_laporan,
            idSheet,
            idWilayahRw,
            data.nama_koordinator,
            data.no_hp_koordinator || null,
            data.timestamp_form,
            data.tanggal_pelaksanaan,
            data.jumlah_rt_diperiksa,
            data.jumlah_jumantik_melapor,
            data.jumlah_rumah_tangga_dikunjungi,
            data.jumlah_jentik_rumah_tangga,
            data.jumlah_perkantoran_dikunjungi,
            data.jumlah_jentik_perkantoran,
            data.jumlah_pendidikan_dikunjungi,
            data.jumlah_jentik_pendidikan,
            data.jumlah_tempat_umum_dikunjungi,
            data.jumlah_jentik_tempat_umum,
            data.jumlah_tempat_olahraga_dikunjungi,
            data.jumlah_jentik_tempat_olahraga,
            data.jumlah_tpm_dikunjungi,
            data.jumlah_jentik_tpm,
            data.jumlah_kesehatan_dikunjungi,
            data.jumlah_jentik_kesehatan,
            data.jumlah_dikunjungi_seluruhnya,
            data.jumlah_jentik_seluruhnya,
            data.jumlah_kontainer_diperiksa,
            data.total_lokasi_positif,
            data.abj_persen,
            data.dokumentasi_kegiatan,
            data.kendala_lapangan,
          ],
        );

        // Menandai data berhasil disinkronkan.
        await client.query(
          `UPDATE laporan_psn_sheet
           SET status_sinkronisasi = 'berhasil',
               pesan_error = NULL,
               disinkronkan_at = NOW(),
               updated_at = NOW()
           WHERE id_sheet = $1`,
          [idSheet],
        );

        await client.query(`RELEASE SAVEPOINT ${savepoint}`);

        berhasilDisimpan++;
      } catch (rowError) {
        await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);
        await client.query(`RELEASE SAVEPOINT ${savepoint}`);

        gagalDisimpan++;

        daftarError.push({
          baris: index + 2,
          pesan: rowError.message,
        });
      }
    }

    await client.query("COMMIT");

    return res.json({
      success: gagalDisimpan === 0,
      message:
        gagalDisimpan === 0
          ? "Sinkronisasi Google Sheets berhasil."
          : "Sinkronisasi selesai dengan beberapa data gagal diproses.",
      data: {
        total_dibaca: rows.length,
        berhasil_disimpan: berhasilDisimpan,
        gagal_disimpan: gagalDisimpan,
        dilewati: dilewati,
        detail_error: daftarError,
      },
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

module.exports = {
  getLaporanPsn,
  syncLaporanPsn,
};
