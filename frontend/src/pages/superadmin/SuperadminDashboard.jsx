import { useState } from "react";
import {
  Users,
  ShieldCheck,
  Home,
  MapPin,
  Hash,
  UserRound,
  ClipboardList,
  UserPlus,
  FileText,
  RefreshCw,
} from "lucide-react";

import "../../assets/styles/SuperadminDashboard.css";

const statistik = [
  {
    label: "Total pengguna",
    value: 5,
    icon: Users,
    color: "blue",
  },
  {
    label: "Angka bebas jentik",
    value: 3,
    icon: Hash,
    color: "blue",
  },
  {
    label: "Rumah diperiksa",
    value: 2,
    icon: Home,
    color: "orange",
  },
  {
    label: "Temuan positif",
    value: 3,
    icon: ShieldCheck,
    color: "red",
  },
  {
    label: "Wilayah prioritas",
    value: 3,
    icon: MapPin,
    color: "green",
  },
];

const dataABJ = [
  { minggu: "Minggu 1", nilai: 85 },
  { minggu: "Minggu 2", nilai: 90.5 },
  { minggu: "Minggu 3", nilai: 92.8 },
  { minggu: "Minggu 4", nilai: 93.8 },
];

const dataPemeriksaan = [
  { minggu: "Minggu 1", bebas: 135, positif: 13 },
  { minggu: "Minggu 2", bebas: 100, positif: 15 },
  { minggu: "Minggu 3", bebas: 70, positif: 5 },
  { minggu: "Minggu 4", bebas: 160, positif: 8 },
];

const dataTemuan = [
  { rw: "RW 01", jumlah: 38, persen: 30, status: "Merah" },
  { rw: "RW 02", jumlah: 29, persen: 23, status: "Merah" },
  { rw: "RW 03", jumlah: 24, persen: 19, status: "Kuning" },
  { rw: "RW 04", jumlah: 17, persen: 13, status: "Kuning" },
  { rw: "RW 05", jumlah: 12, persen: 9, status: "Hijau" },
  { rw: "RW 06", jumlah: 7, persen: 5, status: "Hijau" },
];

const dataTempat = [
  { nama: "Bak mandi", jumlah: 38, persen: 30, warna: "#145c35" },
  { nama: "Ember", jumlah: 38, persen: 30, warna: "#2e9360" },
  { nama: "Dispenser", jumlah: 25, persen: 20, warna: "#83c8a0" },
  { nama: "Barang bekas", jumlah: 14, persen: 11, warna: "#edb83f" },
  { nama: "Lainnya", jumlah: 12, persen: 9, warna: "#bd292e" },
];

const aktivitas = [
  {
    tipe: "pengguna",
    judul: "Siti Aminah ditambahkan sebagai Kader Jumantik RW 03",
    keterangan: "Oleh Superadmin",
    waktu: "10 menit lalu",
    label: "Pengguna baru",
  },
  {
    tipe: "pemeriksaan",
    judul:
      "Laporan pemeriksaan RW 01 masuk: 42 rumah diperiksa, 5 positif jentik",
    keterangan: "Kader: Budi Santoso",
    waktu: "10 menit lalu",
    label: "Data pemeriksaan",
  },
  {
    tipe: "pengguna",
    judul: "Rudi Hartono ditambahkan sebagai Admin Kelurahan",
    keterangan: "Oleh Superadmin",
    waktu: "10 menit lalu",
    label: "Pengguna baru",
  },
  {
    tipe: "pemeriksaan",
    judul:
      "Laporan pemeriksaan RW 04 masuk: 38 rumah diperiksa, 3 positif jentik",
    keterangan: "Kader: Ani Wulandari",
    waktu: "10 menit lalu",
    label: "Data pemeriksaan",
  },
  {
    tipe: "pemeriksaan",
    judul: "Sinkronisasi Google Sheets berhasil: 5 laporan baru",
    keterangan: "Sistem",
    waktu: "10 menit lalu",
    label: "Data pemeriksaan",
  },
];

function GrafikABJ() {
  const points = dataABJ
    .map((item, index) => {
      const x = 55 + index * 100;
      const y = 205 - ((item.nilai - 70) / 30) * 175;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className="superadmin-chart-svg"
      viewBox="0 0 440 250"
      preserveAspectRatio="none"
    >
      {[70, 80, 90, 100].map((value) => {
        const y = 205 - ((value - 70) / 30) * 175;

        return (
          <g key={value}>
            <line
              x1="55"
              y1={y}
              x2="425"
              y2={y}
              stroke="#aebbb5"
              strokeWidth="1"
            />
            <text x="5" y={y + 4} className="chart-label">
              {value}%
            </text>
          </g>
        );
      })}

      {[1, 2, 3, 4].map((item, index) => (
        <line
          key={item}
          x1={55 + index * 100}
          y1="30"
          x2={55 + index * 100}
          y2="205"
          stroke="#9aafa4"
          strokeWidth="1"
        />
      ))}

      <line
        x1="55"
        y1={205 - ((93.5 - 70) / 30) * 175}
        x2="425"
        y2={205 - ((93.5 - 70) / 30) * 175}
        stroke="#f2a52c"
        strokeWidth="1.5"
        strokeDasharray="8 5"
      />

      <polyline
        points={points}
        fill="none"
        stroke="#19b85c"
        strokeWidth="2.5"
      />

      {dataABJ.map((item, index) => {
        const x = 55 + index * 100;
        const y = 205 - ((item.nilai - 70) / 30) * 175;

        return (
          <circle
            key={item.minggu}
            cx={x}
            cy={y}
            r="5.5"
            fill="#20b960"
            stroke="white"
            strokeWidth="1.5"
          />
        );
      })}

      {dataABJ.map((item, index) => (
        <text
          key={item.minggu}
          x={55 + index * 100}
          y="222"
          textAnchor="middle"
          className="chart-bottom-label"
        >
          {item.minggu}
        </text>
      ))}
    </svg>
  );
}

function GrafikPemeriksaan() {
  const maxValue = 180;

  return (
    <div className="superadmin-bar-chart">
      <div className="superadmin-bar-yaxis">
        <span>180%</span>
        <span>90%</span>
        <span>0%</span>
      </div>

      <div className="superadmin-bar-content">
        <div className="superadmin-bar-grid">
          <span />
          <span />
          <span />
        </div>

        {dataPemeriksaan.map((item) => (
          <div className="superadmin-bar-column" key={item.minggu}>
            <div
              className="superadmin-bar-stack"
              style={{
                height: `${((item.bebas + item.positif) / maxValue) * 100}%`,
              }}
            >
              <div
                className="superadmin-bar-positive"
                style={{
                  height: `${(item.positif / (item.bebas + item.positif)) * 100}%`,
                }}
              />
              <div className="superadmin-bar-free" />
            </div>

            <span className="superadmin-bar-label">{item.minggu}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuperadminDashboard() {
  const [periode, setPeriode] = useState("4 Minggu Terakhir");
  const [wilayah, setWilayah] = useState("Semua RW");
  const [filterAktivitas, setFilterAktivitas] = useState("Semua");

  const filteredAktivitas = aktivitas.filter((item) => {
    if (filterAktivitas === "Semua") return true;
    if (filterAktivitas === "Pengguna baru") return item.tipe === "pengguna";
    if (filterAktivitas === "Data pemeriksaan")
      return item.tipe === "pemeriksaan";
    return true;
  });

  return (
    <div className="superadmin-dashboard">
      {/* Banner sambutan */}
      <section className="superadmin-welcome">
        <h1>Selamat datang, SUPERADMIN</h1>
        <p>Pantau kondisi PSN dan tindak lanjut seluruh wilayah.</p>
      </section>

      {/* Filter dashboard */}
      <section className="superadmin-dashboard-filter">
        <div className="superadmin-filter-group">
          <label>Periode</label>
          <select value={periode} onChange={(e) => setPeriode(e.target.value)}>
            <option>7 Hari Terakhir</option>
            <option>4 Minggu Terakhir</option>
            <option>Bulan Ini</option>
            <option>Bulan Lalu</option>
          </select>
        </div>

        <div className="superadmin-filter-group">
          <label>Wilayah</label>
          <select value={wilayah} onChange={(e) => setWilayah(e.target.value)}>
            <option>Semua RW</option>
            {Array.from({ length: 19 }, (_, i) => (
              <option key={i}>RW {String(i + 1).padStart(2, "0")}</option>
            ))}
          </select>
        </div>

        <button
          className="superadmin-download-button"
          type="button"
          onClick={() =>
            window.alert(
              "Fitur unduh rekap akan dihubungkan ke endpoint laporan.",
            )
          }
        >
          Unduh Rekap
        </button>
      </section>

      {/* Kartu statistik */}
      <section className="superadmin-statistics">
        {statistik.map((item) => {
          const Icon = item.icon;

          return (
            <div className="superadmin-stat-card" key={item.label}>
              <div className={`superadmin-stat-icon ${item.color}`}>
                <Icon size={27} />
              </div>

              <div className="superadmin-stat-info">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </div>
          );
        })}
      </section>

      {/* Grafik ABJ dan pemeriksaan */}
      <section className="superadmin-chart-grid">
        <div className="superadmin-panel superadmin-abj-panel">
          <div className="superadmin-panel-heading">
            <h2>Grafik Perkembangan ABJ</h2>

            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
            >
              <option>7 Hari Terakhir</option>
              <option>4 Minggu Terakhir</option>
              <option>Bulan Ini</option>
            </select>
          </div>

          <GrafikABJ />
        </div>

        <div className="superadmin-panel superadmin-examination-panel">
          <div className="superadmin-panel-heading">
            <h2>Grafik Pemeriksaan PSN</h2>

            <div className="superadmin-chart-legend">
              <span>
                <i className="legend-free" /> Bebas jentik
              </span>
              <span>
                <i className="legend-positive" /> Positif jentik
              </span>
            </div>
          </div>

          <GrafikPemeriksaan />
        </div>
      </section>

      {/* Temuan jentik dan jenis penampungan */}
      <section className="superadmin-panel superadmin-findings-panel">
        <div className="superadmin-findings-left">
          <div className="superadmin-panel-heading">
            <div>
              <h2>Grafik Temuan Jentik</h2>
              <p>
                Wilayah paling rawan dan sumber jentik yang paling sering
                ditemukan
              </p>
            </div>

            <button
              type="button"
              className="superadmin-see-all"
              onClick={() =>
                window.alert(
                  "Daftar temuan jentik akan dihubungkan ke halaman monitoring.",
                )
              }
            >
              Lihat Semua
            </button>
          </div>

          <h3 className="superadmin-subheading">PERINGKAT TEMUAN PER RW</h3>

          <div className="superadmin-ranking-list">
            {dataTemuan.map((item, index) => (
              <div className="superadmin-ranking-row" key={item.rw}>
                <span className="superadmin-ranking-number">{index + 1}</span>

                <span className="superadmin-ranking-name">{item.rw}</span>

                <div className="superadmin-ranking-track">
                  <div
                    className={`superadmin-ranking-progress ${item.status.toLowerCase()}`}
                    style={{ width: `${(item.jumlah / 38) * 100}%` }}
                  />
                </div>

                <strong className="superadmin-ranking-value">{item.jumlah}</strong>

                <span className="superadmin-ranking-percent">{item.persen}%</span>

                <span
                  className={`superadmin-ranking-status ${item.status.toLowerCase()}`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="superadmin-findings-right">
          <h3 className="superadmin-subheading">JENIS TEMPAT PENAMPUNGAN</h3>

          <div className="superadmin-donut-wrapper">
            <div
              className="superadmin-donut"
              style={{
                background: `conic-gradient(${dataTempat
                  .map((item, index) => {
                    const start = dataTempat
                      .slice(0, index)
                      .reduce((sum, current) => sum + current.persen, 0);
                    return `${item.warna} ${start}% ${start + item.persen}%`;
                  })
                  .join(", ")})`,
              }}
            >
              <div className="superadmin-donut-center">
                <strong>127</strong>
                <span>temuan</span>
              </div>
            </div>
          </div>

          <div className="superadmin-donut-legend">
            {dataTempat.map((item) => (
              <div className="superadmin-donut-legend-row" key={item.nama}>
                <span>
                  <i style={{ background: item.warna }} />
                  {item.nama}
                </span>

                <strong>{item.jumlah}</strong>
                <small>{item.persen}%</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Riwayat aktivitas */}
      <section className="superadmin-panel superadmin-activity-panel">
        <div className="superadmin-activity-heading">
          <div>
            <h2>Riwayat Aktivitas</h2>
            <p>Aktivitas terbaru pada sistem Monitoring PSN dan Jumantik.</p>
          </div>

          <div className="superadmin-activity-filters">
            {["Semua", "Pengguna baru", "Data pemeriksaan"].map((item) => (
              <button
                type="button"
                key={item}
                className={filterAktivitas === item ? "active" : ""}
                onClick={() => setFilterAktivitas(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="superadmin-activity-list">
          {filteredAktivitas.map((item, index) => (
            <div className="superadmin-activity-row" key={index}>
              <div className="superadmin-activity-icon">
                {item.tipe === "pengguna" ? (
                  <UserPlus size={18} />
                ) : (
                  <ClipboardList size={18} />
                )}
              </div>

              <div className="superadmin-activity-description">
                <strong>{item.judul}</strong>
                <span>{item.keterangan}</span>
              </div>

              <span
                className={`superadmin-activity-badge ${
                  item.tipe === "pengguna" ? "user" : "data"
                }`}
              >
                {item.label}
              </span>

              <span className="superadmin-activity-time">{item.waktu}</span>
            </div>
          ))}

          {filteredAktivitas.length === 0 && (
            <div className="superadmin-activity-empty">Belum ada aktivitas.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default SuperadminDashboard;
