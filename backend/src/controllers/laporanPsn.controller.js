const crypto = require("crypto");
const { pool } = require("../config/database");
const { getSheetData } = require("../config/googleSheets");

const COLUMN_COUNT = 27;
const BATCH_SIZE = 50;

function parseCount(value) {
  if (value === null || value === undefined || value === "") return 0;

  const cleanedValue = String(value)
    .trim()
    .replace(/\s+/g, "")
    .replace(/rt|orang/gi, "")
    .replace(/[^\d]/g, "");

  const result = Number(cleanedValue);
  return Number.isFinite(result) ? result : 0;
}

function parsePercentage(value) {
  if (value === null || value === undefined || value === "") return null;

  let cleaned = String(value).trim().replace(/%/g, "").replace(/\s/g, "");
  if (cleaned.includes(",")) cleaned = cleaned.replace(/\./g, "").replace(",", ".");

  const number = Number(cleaned);
  if (!Number.isFinite(number) || number < 0 || number > 100) return null;
  return Number(number.toFixed(2));
}

function buildDate(year, month, day) {
  if (
    !Number.isInteger(year) || year < 2000 || year > 2100 ||
    !Number.isInteger(month) || month < 1 || month > 12 ||
    !Number.isInteger(day) || day < 1 || day > 31
  ) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;

  return date.toISOString().slice(0, 10);
}

function parseDate(value) {
  if (!value) return null;
  const dateString = String(value).trim();
  if (!dateString) return null;

  const corrections = {
    "10/23/2926": "2026-10-23",
    "6/12/0026": "2026-06-12",
  };
  if (corrections[dateString]) return corrections[dateString];

  const isoMatch = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return buildDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const monthNames = {
    januari: 1, jan: 1, februari: 2, feb: 2, maret: 3, mar: 3,
    april: 4, apr: 4, mei: 5, may: 5, juni: 6, jun: 6,
    juli: 7, jul: 7, agustus: 8, agu: 8, agt: 8,
    september: 9, sep: 9, oktober: 10, okt: 10, oct: 10,
    november: 11, nov: 11, desember: 12, des: 12, dec: 12,
  };

  const indoMatch = dateString.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{2,4})$/i);
  if (indoMatch) {
    const day = Number(indoMatch[1]);
    const month = monthNames[indoMatch[2].toLowerCase()];
    let year = Number(indoMatch[3]);
    if (year < 100) year += 2000;
    return buildDate(year, month, day);
  }

  const numericMatch = dateString.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (numericMatch) {
    const first = Number(numericMatch[1]);
    const second = Number(numericMatch[2]);
    let year = Number(numericMatch[3]);
    if (year < 100) year += 2000;

    let month;
    let day;
    if (first > 12) {
      day = first;
      month = second;
    } else {
      month = first;
      day = second;
    }
    return buildDate(year, month, day);
  }

  return null;
}

function formatTanggalIndonesia(value) {
  if (!value) return "";
  const parsedDate = parseDate(value);
  if (!parsedDate) return String(value);
  const [year, month, day] = parsedDate.split("-");
  return `${day}/${month}/${year}`;
}

function buildTimestamp(year, month, day, hour, minute, second) {
  if (
    year < 2000 || year > 2100 || month < 1 || month > 12 ||
    day < 1 || day > 31 || hour < 0 || hour > 23 ||
    minute < 0 || minute > 59 || second < 0 || second > 59
  ) return null;

  const date = new Date(year, month - 1, day, hour, minute, second);
  if (
    date.getFullYear() !== year || date.getMonth() !== month - 1 ||
    date.getDate() !== day || date.getHours() !== hour ||
    date.getMinutes() !== minute || date.getSeconds() !== second
  ) return null;
  return date;
}

function parseTimestamp(value) {
  if (!value) return null;
  const timestamp = String(value).trim();
  if (!timestamp) return null;

  if (/^\d{4}-\d{2}-\d{2}T/.test(timestamp)) {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const isoMatch = timestamp.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (isoMatch) {
    return buildTimestamp(
      Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]),
      Number(isoMatch[4] || 0), Number(isoMatch[5] || 0), Number(isoMatch[6] || 0),
    );
  }

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
  if (first > 12) {
    day = first;
    month = second;
  } else {
    month = first;
    day = second;
  }

  if (meridiem === "PM" && hour < 12) hour += 12;
  else if (meridiem === "AM" && hour === 12) hour = 0;

  return buildTimestamp(year, month, day, hour, minute, secondValue);
}

function parseNomorRw(value) {
  const match = String(value || "").match(/\d+/);
  if (!match) return null;
  const nomor = Number(match[0]);
  return Number.isInteger(nomor) && nomor >= 1 && nomor <= 99 ? nomor : null;
}

function isEmptyRow(row) {
  return !row.some((value) => String(value ?? "").trim() !== "");
}

function createSourceId(timestampValue, row) {
  const identity = timestampValue
    ? `timestamp:${String(timestampValue).trim()}`
    : `row:${JSON.stringify(row)}`;
  return crypto.createHash("sha256").update(identity).digest("hex");
}

function createKodeLaporan(sourceId) {
  return `PSN-${sourceId.substring(0, 16).toUpperCase()}`;
}

function mapSheetRow(row, headers) {
  const values = Array.from({ length: COLUMN_COUNT }, (_, index) => row[index] ?? "");
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
  if (value === null || value === undefined || value === "") return "";
  let cleanedValue = String(value)
    .trim()
    .toLowerCase()
    .replace(/persen|petsen/gi, "")
    .replace(/[%℅]/g, "")
    .replace(/\s+/g, "")
    .replace(/'/g, ".");
  cleanedValue = cleanedValue.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(cleanedValue)) return String(value);
  return `${cleanedValue.replace(".", ",")}%`;
}

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
          const namaKolom = String(header || "").trim().toLowerCase();

          if (columnIndex === 0 && value) {
            const match = String(value).match(
              /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/,
            );
            if (match) {
              const [, month, day, year, hour, minute, second] = match;
              value = `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year} ${hour.padStart(2, "0")}:${minute}:${second}`;
            }
          }

          if (columnIndex === 3 && value) value = formatTanggalIndonesia(value);
          if (columnIndex === 5 && value) value = `${parseCount(value)} RT`;
          if (columnIndex === 6 && value) value = `${parseCount(value)} Orang`;
          if (namaKolom.includes("abj") && value) value = formatPersentaseIndonesia(value);

          return { header: header || `Kolom ${columnIndex + 1}`, value };
        }),
      }))
      .filter((item) => item.raw_data.some((column) => String(column.value).trim() !== ""));

    return res.json({
      success: true,
      message: "Data pemeriksaan PSN berhasil diambil dari Google Sheets.",
      headers,
      data,
      total: data.length,
    });
  } catch (error) {
    return next(error);
  }
}

const UPSERT_SHEET_BATCH_SQL = `
  INSERT INTO laporan_psn_sheet (
    id_respons_sumber, timestamp_sumber, data_mentah,
    status_sinkronisasi, pesan_error, disinkronkan_at, updated_at
  )
  SELECT
    x.id_respons_sumber, x.timestamp_sumber, x.data_mentah,
    'berhasil', NULL, NOW(), NOW()
  FROM jsonb_to_recordset($1::jsonb) AS x(
    id_respons_sumber text,
    timestamp_sumber timestamptz,
    data_mentah jsonb
  )
  ON CONFLICT (id_respons_sumber)
  DO UPDATE SET
    timestamp_sumber = EXCLUDED.timestamp_sumber,
    data_mentah = EXCLUDED.data_mentah,
    status_sinkronisasi = 'berhasil',
    pesan_error = NULL,
    disinkronkan_at = NOW(),
    updated_at = NOW()
  RETURNING id_sheet, id_respons_sumber
`;

const UPSERT_REPORT_BATCH_SQL = `
  INSERT INTO laporan_pemeriksaan (
    kode_laporan, id_sheet, id_wilayah_rw, nama_koordinator,
    no_hp_koordinator, timestamp_form, tanggal_pelaksanaan,
    jumlah_rt_diperiksa, jumlah_jumantik_melapor,
    jumlah_rumah_tangga_dikunjungi, jumlah_jentik_rumah_tangga,
    jumlah_perkantoran_dikunjungi, jumlah_jentik_perkantoran,
    jumlah_pendidikan_dikunjungi, jumlah_jentik_pendidikan,
    jumlah_tempat_umum_dikunjungi, jumlah_jentik_tempat_umum,
    jumlah_tempat_olahraga_dikunjungi, jumlah_jentik_tempat_olahraga,
    jumlah_tpm_dikunjungi, jumlah_jentik_tpm,
    jumlah_kesehatan_dikunjungi, jumlah_jentik_kesehatan,
    jumlah_dikunjungi_seluruhnya, jumlah_jentik_seluruhnya,
    jumlah_kontainer_diperiksa, total_lokasi_positif, abj_persen,
    dokumentasi_kegiatan, kendala_lapangan
  )
  SELECT
    x.kode_laporan, x.id_sheet, x.id_wilayah_rw, x.nama_koordinator,
    x.no_hp_koordinator, x.timestamp_form, x.tanggal_pelaksanaan,
    x.jumlah_rt_diperiksa, x.jumlah_jumantik_melapor,
    x.jumlah_rumah_tangga_dikunjungi, x.jumlah_jentik_rumah_tangga,
    x.jumlah_perkantoran_dikunjungi, x.jumlah_jentik_perkantoran,
    x.jumlah_pendidikan_dikunjungi, x.jumlah_jentik_pendidikan,
    x.jumlah_tempat_umum_dikunjungi, x.jumlah_jentik_tempat_umum,
    x.jumlah_tempat_olahraga_dikunjungi, x.jumlah_jentik_tempat_olahraga,
    x.jumlah_tpm_dikunjungi, x.jumlah_jentik_tpm,
    x.jumlah_kesehatan_dikunjungi, x.jumlah_jentik_kesehatan,
    x.jumlah_dikunjungi_seluruhnya, x.jumlah_jentik_seluruhnya,
    x.jumlah_kontainer_diperiksa, x.total_lokasi_positif, x.abj_persen,
    x.dokumentasi_kegiatan, x.kendala_lapangan
  FROM jsonb_to_recordset($1::jsonb) AS x(
    kode_laporan text,
    id_sheet bigint,
    id_wilayah_rw bigint,
    nama_koordinator text,
    no_hp_koordinator text,
    timestamp_form timestamptz,
    tanggal_pelaksanaan date,
    jumlah_rt_diperiksa integer,
    jumlah_jumantik_melapor integer,
    jumlah_rumah_tangga_dikunjungi integer,
    jumlah_jentik_rumah_tangga integer,
    jumlah_perkantoran_dikunjungi integer,
    jumlah_jentik_perkantoran integer,
    jumlah_pendidikan_dikunjungi integer,
    jumlah_jentik_pendidikan integer,
    jumlah_tempat_umum_dikunjungi integer,
    jumlah_jentik_tempat_umum integer,
    jumlah_tempat_olahraga_dikunjungi integer,
    jumlah_jentik_tempat_olahraga integer,
    jumlah_tpm_dikunjungi integer,
    jumlah_jentik_tpm integer,
    jumlah_kesehatan_dikunjungi integer,
    jumlah_jentik_kesehatan integer,
    jumlah_dikunjungi_seluruhnya integer,
    jumlah_jentik_seluruhnya integer,
    jumlah_kontainer_diperiksa integer,
    total_lokasi_positif integer,
    abj_persen numeric,
    dokumentasi_kegiatan text,
    kendala_lapangan text
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
    updated_at = NOW()
`;

function makeReportPayload(data, idSheet, idWilayahRw) {
  return {
    kode_laporan: data.kode_laporan,
    id_sheet: idSheet,
    id_wilayah_rw: idWilayahRw,
    nama_koordinator: data.nama_koordinator,
    no_hp_koordinator: data.no_hp_koordinator || null,
    timestamp_form: data.timestamp_form,
    tanggal_pelaksanaan: data.tanggal_pelaksanaan,
    jumlah_rt_diperiksa: data.jumlah_rt_diperiksa,
    jumlah_jumantik_melapor: data.jumlah_jumantik_melapor,
    jumlah_rumah_tangga_dikunjungi: data.jumlah_rumah_tangga_dikunjungi,
    jumlah_jentik_rumah_tangga: data.jumlah_jentik_rumah_tangga,
    jumlah_perkantoran_dikunjungi: data.jumlah_perkantoran_dikunjungi,
    jumlah_jentik_perkantoran: data.jumlah_jentik_perkantoran,
    jumlah_pendidikan_dikunjungi: data.jumlah_pendidikan_dikunjungi,
    jumlah_jentik_pendidikan: data.jumlah_jentik_pendidikan,
    jumlah_tempat_umum_dikunjungi: data.jumlah_tempat_umum_dikunjungi,
    jumlah_jentik_tempat_umum: data.jumlah_jentik_tempat_umum,
    jumlah_tempat_olahraga_dikunjungi: data.jumlah_tempat_olahraga_dikunjungi,
    jumlah_jentik_tempat_olahraga: data.jumlah_jentik_tempat_olahraga,
    jumlah_tpm_dikunjungi: data.jumlah_tpm_dikunjungi,
    jumlah_jentik_tpm: data.jumlah_jentik_tpm,
    jumlah_kesehatan_dikunjungi: data.jumlah_kesehatan_dikunjungi,
    jumlah_jentik_kesehatan: data.jumlah_jentik_kesehatan,
    jumlah_dikunjungi_seluruhnya: data.jumlah_dikunjungi_seluruhnya,
    jumlah_jentik_seluruhnya: data.jumlah_jentik_seluruhnya,
    jumlah_kontainer_diperiksa: data.jumlah_kontainer_diperiksa,
    total_lokasi_positif: data.total_lokasi_positif,
    abj_persen: data.abj_persen,
    dokumentasi_kegiatan: data.dokumentasi_kegiatan,
    kendala_lapangan: data.kendala_lapangan,
  };
}

async function saveSingleRow(client, item, idWilayahRw) {
  await client.query("BEGIN");
  try {
    const sheetResult = await client.query(
      `INSERT INTO laporan_psn_sheet (
        id_respons_sumber, timestamp_sumber, data_mentah,
        status_sinkronisasi, pesan_error, disinkronkan_at, updated_at
      ) VALUES ($1, $2, $3::jsonb, 'berhasil', NULL, NOW(), NOW())
      ON CONFLICT (id_respons_sumber)
      DO UPDATE SET
        timestamp_sumber = EXCLUDED.timestamp_sumber,
        data_mentah = EXCLUDED.data_mentah,
        status_sinkronisasi = 'berhasil',
        pesan_error = NULL,
        disinkronkan_at = NOW(),
        updated_at = NOW()
      RETURNING id_sheet`,
      [item.data.id_respons_sumber, item.data.timestamp_sumber, JSON.stringify(item.data.data_mentah)],
    );

    const idSheet = sheetResult.rows[0].id_sheet;
    const report = makeReportPayload(item.data, idSheet, idWilayahRw);
    const columns = Object.keys(report);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const values = Object.values(report);

    await client.query(
      `INSERT INTO laporan_pemeriksaan (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       ON CONFLICT (id_sheet)
       DO UPDATE SET ${columns
         .filter((column) => !["id_sheet", "total_lokasi_positif"].includes(column))
         .map((column) => `${column} = EXCLUDED.${column}`)
         .join(", ")}, updated_at = NOW()`,
      values,
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function processBatch(client, batch, rwMap) {
  await client.query("BEGIN");
  try {
    const sheetPayload = batch.map(({ data }) => ({
      id_respons_sumber: data.id_respons_sumber,
      timestamp_sumber: data.timestamp_sumber,
      data_mentah: data.data_mentah,
    }));

    const sheetResult = await client.query(UPSERT_SHEET_BATCH_SQL, [JSON.stringify(sheetPayload)]);
    const idSheetBySource = new Map(
      sheetResult.rows.map((row) => [row.id_respons_sumber, row.id_sheet]),
    );

    const reportPayload = batch.map(({ data }) => {
      const idSheet = idSheetBySource.get(data.id_respons_sumber);
      if (!idSheet) throw new Error(`ID sheet untuk sumber ${data.id_respons_sumber} tidak ditemukan.`);
      const idWilayahRw = rwMap.get(data.nomor_rw);
      if (!idWilayahRw) throw new Error(`Data RW ${data.nomor_rw} belum tersedia di tabel wilayah_rw.`);
      return makeReportPayload(data, idSheet, idWilayahRw);
    });

    await client.query(UPSERT_REPORT_BATCH_SQL, [JSON.stringify(reportPayload)]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function syncLaporanPsn(req, res, next) {
  if (!process.env.GOOGLE_SHEETS_ID) {
    return res.status(500).json({
      success: false,
      message: "GOOGLE_SHEETS_ID belum dikonfigurasi.",
    });
  }

  let client;
  const syncStartedAt = Date.now();
  try {
    console.log("[PSN SYNC] Memulai sinkronisasi Google Sheets.");
    const sheetStartedAt = Date.now();
    const sheetData = await getSheetData();
    console.log(`[PSN SYNC] Google Sheets selesai dibaca dalam ${Date.now() - sheetStartedAt} ms.`);
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
    const daftarError = [];
    let dilewati = 0;
    let berhasilDisimpan = 0;
    let gagalDisimpan = 0;

    const validBySource = new Map();
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      if (isEmptyRow(row)) {
        dilewati += 1;
        continue;
      }

      const data = mapSheetRow(row, headers);
      let pesanValidasi = null;
      if (!data.timestamp_sumber) pesanValidasi = "Timestamp respons tidak valid.";
      else if (!data.tanggal_pelaksanaan) pesanValidasi = "Tanggal pelaksanaan tidak valid.";
      else if (!data.nomor_rw) pesanValidasi = "Wilayah RW tidak valid.";

      if (pesanValidasi) {
        gagalDisimpan += 1;
        daftarError.push({ baris: index + 2, pesan: pesanValidasi });
        continue;
      }

      const existing = validBySource.get(data.id_respons_sumber);
      const sourceRows = existing ? [...existing.sourceRows, index + 2] : [index + 2];
      validBySource.set(data.id_respons_sumber, { data, sourceRows });
    }

    if (validBySource.size === 0) {
      return res.json({
        success: gagalDisimpan === 0,
        message: "Tidak ada data valid untuk disinkronkan.",
        data: {
          total_dibaca: rows.length,
          berhasil_disimpan: 0,
          gagal_disimpan: gagalDisimpan,
          dilewati,
          detail_error: daftarError,
        },
      });
    }

    const dbConnectStartedAt = Date.now();
    client = await pool.connect();
    console.log(`[PSN SYNC] Koneksi PostgreSQL didapat dalam ${Date.now() - dbConnectStartedAt} ms.`);

    const rwStartedAt = Date.now();
    const rwResult = await client.query(
      "SELECT id_wilayah_rw, nomor_rw FROM wilayah_rw",
    );
    console.log(`[PSN SYNC] Data RW selesai dibaca dalam ${Date.now() - rwStartedAt} ms.`);
    const rwMap = new Map(
      rwResult.rows.map((row) => [Number(row.nomor_rw), row.id_wilayah_rw]),
    );

    const validItems = Array.from(validBySource.values());
    const readyItems = [];
    for (const item of validItems) {
      if (!rwMap.has(item.data.nomor_rw)) {
        gagalDisimpan += item.sourceRows.length;
        for (const baris of item.sourceRows) {
          daftarError.push({
            baris,
            pesan: `Data RW ${item.data.nomor_rw} belum tersedia di tabel wilayah_rw.`,
          });
        }
      } else {
        readyItems.push(item);
      }
    }

    for (let start = 0; start < readyItems.length; start += BATCH_SIZE) {
      const batch = readyItems.slice(start, start + BATCH_SIZE);
      const batchNumber = Math.floor(start / BATCH_SIZE) + 1;
      const batchStartedAt = Date.now();
      console.log(`[PSN SYNC] Memproses batch ${batchNumber}/${Math.ceil(readyItems.length / BATCH_SIZE)} (${batch.length} data).`);
      try {
        await processBatch(client, batch, rwMap);
        berhasilDisimpan += batch.reduce((total, item) => total + item.sourceRows.length, 0);
        console.log(`[PSN SYNC] Batch ${batchNumber} selesai dalam ${Date.now() - batchStartedAt} ms.`);
      } catch (batchError) {
        console.error(
          `[PSN SYNC] Batch ${batchNumber} gagal setelah ${Date.now() - batchStartedAt} ms; mencoba penyimpanan per baris:`,
          batchError.message,
        );

        for (const item of batch) {
          try {
            await saveSingleRow(client, item, rwMap.get(item.data.nomor_rw));
            berhasilDisimpan += item.sourceRows.length;
          } catch (rowError) {
            gagalDisimpan += item.sourceRows.length;
            for (const baris of item.sourceRows) {
              daftarError.push({ baris, pesan: rowError.message });
            }
          }
        }
      }
    }

    console.log(`[PSN SYNC] Selesai dalam ${Date.now() - syncStartedAt} ms. Berhasil: ${berhasilDisimpan}, gagal: ${gagalDisimpan}, dilewati: ${dilewati}.`);

    return res.json({
      success: gagalDisimpan === 0,
      message: gagalDisimpan === 0
        ? "Sinkronisasi Google Sheets berhasil."
        : "Sinkronisasi selesai dengan beberapa data gagal diproses.",
      data: {
        total_dibaca: rows.length,
        berhasil_disimpan: berhasilDisimpan,
        gagal_disimpan: gagalDisimpan,
        dilewati,
        jumlah_batch: Math.ceil(readyItems.length / BATCH_SIZE),
        ukuran_batch: BATCH_SIZE,
        detail_error: daftarError,
      },
    });
  } catch (error) {
    return next(error);
  } finally {
    if (client) client.release();
  }
}

module.exports = {
  getLaporanPsn,
  syncLaporanPsn,
};