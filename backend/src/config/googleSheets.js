const { google } = require("googleapis");

// =========================================================
// GOOGLE OAUTH2 CONFIGURATION
// =========================================================

const requiredEnv = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "GOOGLE_REFRESH_TOKEN",
  "GOOGLE_SHEETS_ID",
  "GOOGLE_SHEETS_RANGE",
];

function validateGoogleConfig() {
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Konfigurasi Google belum lengkap: ${missing.join(", ")}`);
  }
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
}

// =========================================================
// GOOGLE SHEETS CLIENT
// =========================================================

const sheets = google.sheets({
  version: "v4",
  auth: oauth2Client,
});

// =========================================================
// GET GOOGLE SHEETS DATA
// =========================================================

async function getSheetData() {
  validateGoogleConfig();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: process.env.GOOGLE_SHEETS_RANGE,
      majorDimension: "ROWS",
      valueRenderOption: "FORMATTED_VALUE",
    });

    return response.data.values || [];
  } catch (error) {
    const googleMessage = error.response?.data?.error?.message || error.message;

    throw new Error(`Gagal mengambil data Google Sheets: ${googleMessage}`);
  }
}

module.exports = {
  oauth2Client,
  getSheetData,
};
