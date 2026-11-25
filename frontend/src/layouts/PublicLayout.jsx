import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { MapPin, Phone, Mail, Menu, X } from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaXTwitter,
  FaLinkedinIn,
} from "react-icons/fa6";

import logoJakarta from "../assets/images/Logo-Jakarta-Selatan.png";
import "./layouts.css";

const publicMenus = [
  { label: "Beranda", path: "/" },
  { label: "Profil Kelurahan", path: "/profil-kelurahan" },
  { label: "Peta Sebaran", path: "/peta-sebaran" },
  { label: "Hasil Pemantauan", path: "/hasil-pemantauan" },
  { label: "Edukasi", path: "/edukasi" },
  { label: "Berita", path: "/berita" },
];

export default function PublicLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [menuOpen]);

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  return (
    <div className="public-layout">
      <header className="public-header">
        <div className="public-header-inner">
          <Link to="/" className="public-brand" onClick={closeMenu}>
            <img src={logoJakarta} alt="Logo Jakarta Selatan" />

            <div>
              <strong>Kelurahan Srengseng Sawah</strong>
              <span>Monitoring PSN dan Jumantik</span>
            </div>
          </Link>

          <nav className="public-nav" aria-label="Navigasi utama">
            {publicMenus.map((item) => (
              <NavLink key={item.path} to={item.path} end={item.path === "/"}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Link to="/login" className="public-login-button" onClick={closeMenu}>
            Masuk
          </Link>

          <button
            type="button"
            className="public-menu-button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Tutup navigasi" : "Buka navigasi"}
            aria-expanded={menuOpen}
            aria-controls="public-mobile-nav"
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>

        {menuOpen && (
          <div
            className="public-menu-overlay"
            onClick={closeMenu}
            aria-hidden="true"
          />
        )}

        <nav
          id="public-mobile-nav"
          className={`public-mobile-nav ${menuOpen ? "open" : ""}`}
          aria-label="Navigasi mobile"
          aria-hidden={!menuOpen}
          inert={!menuOpen}
        >
          {publicMenus.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={closeMenu}
            >
              {item.label}
            </NavLink>
          ))}

          <Link to="/login" className="mobile-login-link" onClick={closeMenu}>
            Masuk ke Dashboard
          </Link>
        </nav>
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer-inner">
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

          <div>
            <b>Navigasi</b>
            <Link to="/">Beranda</Link>
            <Link to="/peta-sebaran">Peta Sebaran</Link>
            <Link to="/hasil-pemantauan">Hasil Pemantauan</Link>
            <Link to="/jadwal-kegiatan">Jadwal Kegiatan</Link>
          </div>

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

        <div className="copyright">
          © 2026 Kelurahan Srengseng Sawah · Prototype Monitoring PSN
        </div>
      </footer>
    </div>
  );
}
