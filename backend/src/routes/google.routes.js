const express = require("express");
const router = express.Router();

const { oauth2Client, getGoogleAuthUrl } = require("../config/googleOAuth");

// Memulai proses OAuth
router.get("/auth", (req, res) => {
  const url = getGoogleAuthUrl();
  res.redirect(url);
});

// Menerima callback dari Google
router.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("Authorization code tidak ditemukan.");
    }

    const { tokens } = await oauth2Client.getToken(code);

    if (tokens.refresh_token) {
      console.log("\nREFRESH TOKEN GOOGLE:");
      console.log(tokens.refresh_token);
      console.log("\nSimpan token tersebut di file .env.");
    } else {
      console.log("Refresh token tidak dikirim oleh Google.");
    }

    res.send(`
      <h2>OAuth Google berhasil!</h2>
      <p>Silakan periksa terminal backend untuk melihat hasil proses OAuth.</p>
    `);
  } catch (error) {
    console.error("OAuth Error:", error);
    res.status(500).send("Gagal melakukan autentikasi Google.");
  }
});

module.exports = router;
