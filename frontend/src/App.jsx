import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth
import Login from "./pages/auth/Login";
import UbahPassword from "./pages/auth/UbahPassword";

// Layouts
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";
import KasieLayout from "./layouts/KasieLayout";

// Public
import Beranda from "./pages/public/Beranda";

// Dashboard
import DashboardAdmin from "./pages/admin/AdminDashboard";
import DashboardKasie from "./pages/kasie/KasieDashboard";

// Profile
import Profile from "./pages/profile/Profile";

// Admin
import DataPemeriksaan from "./pages/admin/DataPemeriksaan";

// Kasie
import DataPengguna from "./pages/kasie/DataPengguna";
import FormPengguna from "./pages/kasie/FormPengguna";

// Placeholder
import PlaceholderPage from "./pages/PlaceholderPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/ubah-password" element={<UbahPassword />} />

        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Beranda />} />
        </Route>

        {/* Admin Kelurahan */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<DashboardAdmin />} />

          <Route path="profil" element={<Profile />} />

          <Route
            path="wilayah"
            element={
              <PlaceholderPage
                title="Data Wilayah"
                description="Halaman ini digunakan untuk mengelola data wilayah Kelurahan Srengseng Sawah, termasuk informasi RW dan RT."
              />
            }
          />

          <Route
            path="jumantik"
            element={
              <PlaceholderPage
                title="Data Jumantik"
                description="Halaman ini digunakan untuk mengelola data kader Jumantik yang bertugas melakukan pemeriksaan Pemberantasan Sarang Nyamuk (PSN)."
              />
            }
          />

          <Route path="data-pemeriksaan" element={<DataPemeriksaan />} />

          <Route
            path="dokumentasi"
            element={
              <PlaceholderPage
                title="Dokumentasi Kegiatan"
                description="Halaman ini digunakan untuk melihat dan mengelola dokumentasi kegiatan PSN, termasuk foto kegiatan pemeriksaan dan tindak lanjut."
              />
            }
          />

          <Route
            path="jadwal"
            element={
              <PlaceholderPage
                title="Jadwal PSN"
                description="Halaman ini digunakan untuk mengelola dan melihat jadwal pelaksanaan kegiatan Pemberantasan Sarang Nyamuk (PSN) di setiap wilayah."
              />
            }
          />

          <Route
            path="berita"
            element={
              <PlaceholderPage
                title="Berita"
                description="Halaman ini digunakan untuk mengelola berita dan informasi kegiatan PSN serta aktivitas Jumantik di Kelurahan Srengseng Sawah."
              />
            }
          />

          <Route
            path="pengumuman"
            element={
              <PlaceholderPage
                title="Pengumuman"
                description="Halaman ini digunakan untuk membuat dan mengelola pengumuman terkait kegiatan PSN, jadwal pemeriksaan, dan informasi penting lainnya."
              />
            }
          />

          <Route
            path="laporan"
            element={
              <PlaceholderPage
                title="Laporan"
                description="Halaman ini digunakan untuk melihat dan mengelola laporan hasil pemeriksaan PSN berdasarkan periode dan wilayah."
              />
            }
          />
        </Route>

        {/* Kasie Kesra */}
        <Route path="/kasie" element={<KasieLayout />}>
          <Route path="dashboard" element={<DashboardKasie />} />

          <Route path="profil" element={<Profile />} />

          <Route path="data-pengguna" element={<DataPengguna />} />

          <Route path="pengguna/tambah" element={<FormPengguna />} />

          <Route path="pengguna/:id/edit" element={<FormPengguna />} />

          <Route
            path="jumantik"
            element={
              <PlaceholderPage
                title="Data Jumantik"
                description="Halaman ini digunakan untuk memantau dan mengelola data seluruh kader Jumantik yang terdaftar di Kelurahan Srengseng Sawah."
              />
            }
          />

          <Route
            path="wilayah"
            element={
              <PlaceholderPage
                title="Data Wilayah"
                description="Halaman ini digunakan untuk melihat dan mengelola data wilayah RW dan RT sebagai dasar pemantauan kegiatan PSN."
              />
            }
          />

          <Route
            path="monitoring-pemeriksaan"
            element={
              <PlaceholderPage
                title="Monitoring Pemeriksaan PSN"
                description="Halaman ini digunakan untuk memantau pelaksanaan pemeriksaan PSN berdasarkan tanggal, wilayah, jumlah rumah yang diperiksa, dan temuan jentik."
              />
            }
          />

          <Route
            path="rekapitulasi"
            element={
              <PlaceholderPage
                title="Rekapitulasi Pemeriksaan"
                description="Halaman ini digunakan untuk melihat rekapitulasi hasil pemeriksaan PSN secara mingguan dan bulanan, termasuk perhitungan Angka Bebas Jentik (ABJ)."
              />
            }
          />

          <Route
            path="evaluasi"
            element={
              <PlaceholderPage
                title="Evaluasi Tindak Lanjut"
                description="Halaman ini digunakan untuk memantau dan mengevaluasi tindak lanjut terhadap hasil pemeriksaan yang menemukan jentik di wilayah tertentu."
              />
            }
          />

          <Route
            path="wilayah-perhatian"
            element={
              <PlaceholderPage
                title="Wilayah Perhatian"
                description="Halaman ini digunakan untuk mengidentifikasi wilayah yang membutuhkan perhatian berdasarkan hasil pemeriksaan dan indikator Angka Bebas Jentik (ABJ)."
              />
            }
          />

          <Route
            path="laporan"
            element={
              <PlaceholderPage
                title="Laporan"
                description="Halaman ini digunakan untuk melihat laporan monitoring PSN, membandingkan hasil pemeriksaan antarwilayah, dan memantau perkembangan kegiatan."
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
