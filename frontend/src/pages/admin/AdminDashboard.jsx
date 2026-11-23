import { useState } from "react";
import { Hash, Home, ShieldCheck, MapPin } from "lucide-react";

import "../../assets/styles/AdminDashboard.css";

const statistik = [
  {
    label: "Angka bebas jentik",
    value: 5,
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

function GrafikABJ() {
  const points = dataABJ
    .map((item, index) => {
      const x = 65 + index * 105;
      const y = 220 - ((item.nilai - 70) / 30) * 190;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className="admin-chart-svg"
      viewBox="0 0 500 260"
      preserveAspectRatio="none"
    >
      {[70, 80, 90, 100].map((value) => {
        const y = 220 - ((value - 70) / 30) * 190;

        return (
          <g key={value}>
            <line
              x1="65"
              y1={y}
              x2="490"
              y2={y}
              stroke="#aebbb5"
              strokeWidth="1"
            />
            <text x="8" y={y + 4} className="admin-chart-label">
              {value}%
            </text>
          </g>
        );
      })}

      {[1, 2, 3, 4].map((item, index) => (
        <line
          key={item}
          x1={65 + index * 105}
          y1="30"
          x2={65 + index * 105}
          y2="220"
          stroke="#9aafa4"
          strokeWidth="1"
        />
      ))}

      <line
        x1="65"
        y1={220 - ((93.5 - 70) / 30) * 190}
        x2="490"
        y2={220 - ((93.5 - 70) / 30) * 190}
        stroke="#f2a52c"
        strokeWidth="1.5"
        strokeDasharray="9 5"
      />

      <polyline
        points={points}
        fill="none"
        stroke="#19b85c"
        strokeWidth="2.5"
      />

      {dataABJ.map((item, index) => {
        const x = 65 + index * 105;
        const y = 220 - ((item.nilai - 70) / 30) * 190;

        return (
          <circle
            key={item.minggu}
            cx={x}
            cy={y}
            r="6"
            fill="#20b960"
            stroke="white"
            strokeWidth="1.5"
          />
        );
      })}

      {dataABJ.map((item, index) => (
        <text
          key={item.minggu}
          x={65 + index * 105}
          y="239"
          textAnchor="middle"
          className="admin-chart-bottom-label"
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
    <div className="admin-bar-chart">
      <div className="admin-bar-yaxis">
        <span>180%</span>
        <span>90%</span>
        <span>0%</span>
      </div>

      <div className="admin-bar-content">
        <div className="admin-bar-grid">
          <span />
          <span />
          <span />
        </div>

        {dataPemeriksaan.map((item) => (
          <div className="admin-bar-column" key={item.minggu}>
            <div
              className="admin-bar-stack"
              style={{
                height: `${((item.bebas + item.positif) / maxValue) * 100}%`,
              }}
            >
              <div
                className="admin-bar-positive"
                style={{
                  height: `${
                    (item.positif / (item.bebas + item.positif)) * 100
                  }%`,
                }}
              />
              <div className="admin-bar-free" />
            </div>

            <span className="admin-bar-label">{item.minggu}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [periode, setPeriode] = useState("4 Minggu Terakhir");
  const [wilayah, setWilayah] = useState("Semua RW");

  const totalTemuan = dataTempat.reduce(
    (total, item) => total + item.jumlah,
    0,
  );

  const donutBackground = `conic-gradient(${dataTempat
    .map((item, index) => {
      const start = dataTempat
        .slice(0, index)
        .reduce((sum, current) => sum + current.persen, 0);

      return `${item.warna} ${start}% ${start + item.persen}%`;
    })
    .join(", ")})`;

  return (
    <div className="admin-dashboard">
      {/* Banner sambutan */}
      <section className="admin-welcome">
        <h1>Selamat datang, ADMIN</h1>
        <p>Pantau kondisi PSN dan tindak lanjut seluruh wilayah.</p>
      </section>

      {/* Filter */}
      <section className="admin-dashboard-filter">
        <div className="admin-filter-group">
          <label>Periode</label>
          <select value={periode} onChange={(e) => setPeriode(e.target.value)}>
            <option>7 Hari Terakhir</option>
            <option>4 Minggu Terakhir</option>
            <option>Bulan Ini</option>
            <option>Bulan Lalu</option>
          </select>
        </div>

        <div className="admin-filter-group">
          <label>Wilayah</label>
          <select value={wilayah} onChange={(e) => setWilayah(e.target.value)}>
            <option>Semua RW</option>
            {Array.from({ length: 19 }, (_, index) => (
              <option key={index}>
                RW {String(index + 1).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="admin-download-button"
          onClick={() =>
            window.alert("Fitur unduh rekap akan dihubungkan ke backend.")
          }
        >
          Unduh Rekap
        </button>
      </section>

      {/* Statistik */}
      <section className="admin-statistics">
        {statistik.map((item) => {
          const Icon = item.icon;

          return (
            <div className="admin-stat-card" key={item.label}>
              <div className={`admin-stat-icon ${item.color}`}>
                <Icon size={29} />
              </div>

              <div className="admin-stat-info">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </div>
          );
        })}
      </section>

      {/* Grafik ABJ dan pemeriksaan */}
      <section className="admin-chart-grid">
        <div className="admin-panel admin-abj-panel">
          <div className="admin-panel-heading">
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

        <div className="admin-panel admin-examination-panel">
          <div className="admin-panel-heading">
            <h2>Grafik Pemeriksaan PSN</h2>

            <div className="admin-chart-legend">
              <span>
                <i className="admin-legend-free" />
                Bebas jentik
              </span>
              <span>
                <i className="admin-legend-positive" />
                Positif jentik
              </span>
            </div>
          </div>

          <GrafikPemeriksaan />
        </div>
      </section>

      {/* Grafik temuan jentik */}
      <section className="admin-panel admin-findings-panel">
        <div className="admin-findings-left">
          <div className="admin-panel-heading">
            <div>
              <h2>Grafik Temuan Jentik</h2>
              <p>
                Wilayah paling rawan dan sumber jentik yang paling sering
                ditemukan
              </p>
            </div>

            <button
              type="button"
              className="admin-see-all"
              onClick={() =>
                window.alert(
                  "Daftar temuan jentik akan dihubungkan ke halaman monitoring.",
                )
              }
            >
              Lihat Semua
            </button>
          </div>

          <h3 className="admin-subheading">PERINGKAT TEMUAN PER RW</h3>

          <div className="admin-ranking-list">
            {dataTemuan.map((item, index) => (
              <div className="admin-ranking-row" key={item.rw}>
                <span className="admin-ranking-number">{index + 1}</span>

                <span className="admin-ranking-name">{item.rw}</span>

                <div className="admin-ranking-track">
                  <div
                    className={`admin-ranking-progress ${item.status.toLowerCase()}`}
                    style={{
                      width: `${(item.jumlah / 38) * 100}%`,
                    }}
                  />
                </div>

                <strong className="admin-ranking-value">{item.jumlah}</strong>

                <span className="admin-ranking-percent">{item.persen}%</span>

                <span
                  className={`admin-ranking-status ${item.status.toLowerCase()}`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut jenis tempat penampungan */}
        <div className="admin-findings-right">
          <h3 className="admin-subheading">JENIS TEMPAT PENAMPUNGAN</h3>

          <div className="admin-donut-wrapper">
            <div
              className="admin-donut"
              style={{ background: donutBackground }}
            >
              <div className="admin-donut-center">
                <strong>{totalTemuan}</strong>
                <span>temuan</span>
              </div>
            </div>
          </div>

          <div className="admin-donut-legend">
            {dataTempat.map((item) => (
              <div className="admin-donut-legend-row" key={item.nama}>
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
    </div>
  );
}

export default AdminDashboard;
