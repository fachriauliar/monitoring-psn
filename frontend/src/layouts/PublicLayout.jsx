import { Link, Outlet } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
  FaLinkedinIn,
} from "react-icons/fa6";

import logoJakarta from "../assets/images/Logo-Jakarta-Selatan.png";
import "./layouts.css";

export default function PublicLayout() {
  return (
    <div className="public-layout">
      {/* HEADER */}
      <header className="public-header">
        <div className="public-header-inner">
          <Link to="/" className="public-brand">
            <img src={logoJakarta} alt="Logo Jakarta Selatan" />

            <div>
              <strong>Kelurahan Srengseng Sawah</strong>
              <span>Monitoring PSN dan Jumantik</span>
            </div>
          </Link>

          <nav className="public-nav">
            <Link to="/">Beranda</Link>
            <Link to="/profil-kelurahan">Profil Kelurahan</Link>
            <Link to="/peta-sebaran">Peta Sebaran</Link>
            <Link to="/hasil-pemantauan">Hasil Pemantauan</Link>
            <Link to="/edukasi">Edukasi</Link>
            <Link to="/berita">Berita</Link>
          </nav>

          <Link to="/login" className="public-login-button">
            Masuk
          </Link>
        </div>
      </header>

      {/* KONTEN HALAMAN */}
      <main className="public-main">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          {/* BRAND */}
          <div className="footer-brand">
            <img
              src={logoJakarta}
              alt="Logo Jakarta Selatan"
              className="jakarta-logo"
            />

            <div>
              <b>Kelurahan Srengseng Sawah</b>
              <small>Jakarta Selatan</small>

              <p>
                Mewujudkan lingkungan yang bersih, sehat, dan nyaman bagi
                seluruh masyarakat.
              </p>
            </div>
          </div>

          {/* NAVIGASI */}
          <div>
            <b>Navigasi</b>

            <Link to="/">Beranda</Link>
            <Link to="/peta-sebaran">Peta Sebaran</Link>
            <Link to="/hasil-pemantauan">Hasil Pemantauan</Link>
            <Link to="/jadwal-kegiatan">Jadwal Kegiatan</Link>
          </div>

          {/* INFORMASI KONTAK */}
          <div className="footer-contact">
            <b>Informasi Kontak</b>

            <div className="contact-item">
              <MapPin size={15} />

              <p>
                Kelurahan Srengseng Sawah, Kecamatan Jagakarsa, Kota
                Administrasi Jakarta Selatan, DKI Jakarta.
              </p>
            </div>

            <div className="contact-item">
              <Phone size={15} />

              <a href="tel:+6221XXXXXXXX">+62 21 XXXX XXXX</a>
            </div>

            <div className="contact-item">
              <Mail size={15} />

              <a href="mailto:email@kelurahan.go.id">email@kelurahan.go.id</a>
            </div>
          </div>

          {/* MEDIA SOSIAL */}
          <div className="footer-social">
            <b>Ikuti Kami</b>

            <div className="socials">
              <a
                href="https://facebook.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                <FaFacebookF />
              </a>

              <a
                href="https://instagram.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>

              <a
                href="https://x.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="X"
              >
                <FaXTwitter />
              </a>

              <a
                href="https://linkedin.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn />
              </a>
            </div>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="copyright">
          © 2026 Kelurahan Srengseng Sawah · Prototype Monitoring PSN
        </div>
      </footer>
    </div>
  );
}
