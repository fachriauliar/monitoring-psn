import React, { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Droplets,
  House,
  Users,
  Bug,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "../../assets/styles/beranda.css";
import fotoKelurahan from "../../assets/images/Kelurahan-Srengseng-Sawah.png";
import fotoHeroSection from "../../assets/images/Hero-Section.png";

const chartData = [
  { minggu: "Minggu 1", abj: 86.5, target: 95 },
  { minggu: "Minggu 2", abj: 88.7, target: 95 },
  { minggu: "Minggu 3", abj: 91.0, target: 95 },
  { minggu: "Minggu 4", abj: 92.3, target: 95 },
];

const news = [
  {
    tag: "Edukasi",
    date: "12 Jul 2026",
    title: "Jaga Lingkungan, Cegah DBD!",
    desc: "Kenali langkah sederhana menjaga lingkungan rumah agar bebas dari tempat berkembang biak nyamuk.",
    image:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=700&q=80",
  },
  {
    tag: "Pengumuman",
    date: "11 Jul 2026",
    title: "Waspada DBD di Musim Hujan",
    desc: "Tingkatkan kewaspadaan dan lakukan pemeriksaan jentik secara rutin di lingkungan sekitar.",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=700&q=80",
  },
  {
    tag: "Kegiatan",
    date: "08 Jul 2026",
    title: "Aksi PSN Serentak Wilayah RW",
    desc: "Kader Jumantik bersama warga melaksanakan kegiatan pemberantasan sarang nyamuk.",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=700&q=80",
  },
];

const schedule = [
  {
    day: "07",
    month: "JUL",
    title: "Pemeriksaan Jentik Berkala",
    area: "RW 03 · RT 01–05",
    status: "Selesai",
  },
  {
    day: "14",
    month: "JUL",
    title: "PSN Serentak",
    area: "RW 07 · RT 01–08",
    status: "Terjadwal",
  },
  {
    day: "21",
    month: "JUL",
    title: "Pemeriksaan Jentik Berkala",
    area: "RW 12 · RT 01–06",
    status: "Terjadwal",
  },
  {
    day: "28",
    month: "JUL",
    title: "Evaluasi dan Rekapitulasi",
    area: "Kelurahan Srengseng Sawah",
    status: "Terjadwal",
  },
];

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Hero() {
  return (
    <section className="hero" id="beranda">
      <div className="hero-copy">
        <span className="eyebrow">INFORMASI</span>
        <h1>Pemberantasan Sarang Nyamuk Bersama</h1>
        <p>
          Ajak keluarga dan warga sekitar untuk menjaga lingkungan tetap bersih,
          memantau jentik, dan mencegah penyebaran DBD mulai dari rumah.
        </p>
        <div className="hero-actions">
          <a className="btn-primary" href="#peta">
            Lihat Peta Sebaran <ArrowRight size={16} />
          </a>
          <a className="btn-outline" href="#jadwal">
            Jadwal Kegiatan PSN
          </a>
        </div>
      </div>
      <div className="hero-image">
        <img
          src={fotoHeroSection}
          alt="Ilustrasi pemeriksaan lingkungan"
        />
      </div>
    </section>
  );
}

function Profile() {
  return (
    <section className="section" id="profil">
      <SectionTitle title="Profil Kelurahan" />
      <div className="profile-grid">
        <img
          className="office-img"
          src={fotoKelurahan}
          alt="Foto Kelurahan Srengseng Sawah"
        />
        <article className="profile-card">
          <span className="eyebrow">JAKARTA SELATAN</span>
          <h2>
            Kelurahan
            <br />
            <em>Srengseng Sawah</em>
          </h2>
          <p>
            Kelurahan Srengseng Sawah merupakan salah satu wilayah di Kecamatan
            Jagakarsa, Kota Administrasi Jakarta Selatan. Melalui kegiatan
            pemantauan jentik berkala, masyarakat bersama kader Jumantik
            berperan aktif menjaga lingkungan agar tetap bersih dan sehat.
          </p>
          <button
            className="btn-primary full"
            onClick={() =>
              alert(
                "Informasi profil kelurahan akan ditampilkan di halaman detail.",
              )
            }
          >
            Selengkapnya
          </button>
        </article>
        <div className="mini-stats">
          <Stat
            color="blue"
            label="Angka Bebas Jentik"
            value="92,3%"
            icon={<Droplets />}
          />
          <Stat
            color="red"
            label="Rumah Positif Jentik"
            value="7,7%"
            icon={<Bug />}
          />
          <Stat
            color="yellow"
            label="Rumah Diperiksa"
            value="1.250"
            icon={<House />}
          />
          <Stat
            color="green"
            label="Kader Jumantik"
            value="175"
            icon={<Users />}
          />
        </div>
      </div>
    </section>
  );
}

function Stat({ color, label, value, icon }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function MapSection() {
  const [selected, setSelected] = useState("RW 003");
  const areas = [
    {
      id: "RW 003",
      cls: "area-red",
      style: { left: "13%", top: "18%", width: "23%", height: "29%" },
      abj: "90,0%",
      examined: "90",
      positive: "9",
    },
    {
      id: "RW 007",
      cls: "area-yellow",
      style: { left: "46%", top: "30%", width: "10%", height: "15%" },
      abj: "94,2%",
      examined: "105",
      positive: "6",
    },
    {
      id: "RW 012",
      cls: "area-green",
      style: { left: "25%", top: "61%", width: "21%", height: "27%" },
      abj: "97,1%",
      examined: "120",
      positive: "3",
    },
    {
      id: "RW 015",
      cls: "area-green",
      style: { left: "70%", top: "28%", width: "10%", height: "16%" },
      abj: "96,4%",
      examined: "98",
      positive: "4",
    },
    {
      id: "RW 018",
      cls: "area-red",
      style: { left: "73%", top: "68%", width: "20%", height: "25%" },
      abj: "88,5%",
      examined: "110",
      positive: "13",
    },
  ];
  const current = areas.find((a) => a.id === selected);
  return (
    <section className="section" id="peta">
      <SectionTitle
        title="Peta Sebaran Kondisi PSN"
        subtitle="Pantau kondisi wilayah berdasarkan hasil pemeriksaan jentik berkala."
      />
      <div className="map-layout">
        <div className="map-canvas">
          <div className="map-road road-one" />
          <div className="map-road road-two" />
          <div className="map-road road-three" />
          <span className="map-label label-a">Jl. Srengseng Sawah</span>
          <span className="map-label label-b">Universitas Pancasila</span>
          <span className="map-label label-c">Kawasan Permukiman</span>
          {areas.map((a) => (
            <button
              key={a.id}
              title={a.id}
              onClick={() => setSelected(a.id)}
              className={`map-area ${a.cls} ${selected === a.id ? "chosen" : ""}`}
              style={a.style}
            />
          ))}
          <div className="map-credit">Peta ilustrasi · Data wilayah contoh</div>
        </div>
        <div className="map-side">
          <div className="legend">
            <b>Keterangan</b>
            <span>
              <i className="dot green-dot" /> Kondisi Terkendali
            </span>
            <span>
              <i className="dot yellow-dot" /> Perlu Pemantauan
            </span>
            <span>
              <i className="dot red-dot" /> Perlu Penanganan
            </span>
          </div>
          <div className="area-detail">
            <span className="eyebrow">DETAIL WILAYAH</span>
            <h3>{current.id}</h3>
            <div className="detail-row">
              <span>Rumah diperiksa</span>
              <b>{current.examined}</b>
            </div>
            <div className="detail-row">
              <span>Rumah positif jentik</span>
              <b>{current.positive}</b>
            </div>
            <div className="detail-row">
              <span>Angka Bebas Jentik</span>
              <b>{current.abj}</b>
            </div>
            <button
              className="btn-primary full"
              onClick={() =>
                alert(`Detail ${current.id} masih berupa data prototype.`)
              }
            >
              Lihat Detail
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Progress() {
  return (
    <section className="section" id="perkembangan">
      <SectionTitle
        title="Perkembangan Angka Bebas Jentik (ABJ)"
        subtitle="Informasi tren hasil pemeriksaan jentik sebagai gambaran kondisi wilayah."
      />
      <div className="progress-grid">
        <div className="chart-card">
          <div className="chart-heading">
            <div>
              <strong className="big-number">92,3%</strong>
              <span className="growth">+1,8%</span>
              <small>dari periode sebelumnya</small>
            </div>
            <button className="period-btn">
              4 Minggu Terakhir <ChevronDown size={14} />
            </button>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 18, right: 12, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="abjFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2bc878" stopOpacity={0.25} />
                    <stop
                      offset="100%"
                      stopColor="#2bc878"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 4"
                  vertical={false}
                  stroke="#dce9e4"
                />
                <XAxis
                  dataKey="minggu"
                  tick={{ fontSize: 10, fill: "#74847d" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[70, 100]}
                  ticks={[70, 80, 90, 100]}
                  tick={{ fontSize: 10, fill: "#74847d" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip formatter={(v) => `${v}%`} />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="#e5a63a"
                  strokeDasharray="5 5"
                  fill="none"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="abj"
                  stroke="#20b96b"
                  fill="url(#abjFill)"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#20b96b",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            <span>
              <i className="dot green-dot" /> ABJ
            </span>
            <span>
              <i className="dash" /> Target (95%)
            </span>
          </div>
        </div>
        <div className="summary-card">
          <h3>Ringkasan Minggu 4</h3>
          <div className="summary-item">
            <House />
            <div>
              <small>Rumah diperiksa</small>
              <b>1.250</b>
            </div>
          </div>
          <div className="summary-item">
            <CheckCircle2 />
            <div>
              <small>Bebas jentik</small>
              <b>1.154</b>
            </div>
          </div>
          <div className="summary-item">
            <Bug />
            <div>
              <small>Positif jentik</small>
              <b>96</b>
            </div>
          </div>
          <div className="progress-label">
            <span>Capaian vs Target</span>
            <b>92,3% / 95%</b>
          </div>
          <div className="progress-track">
            <i />
          </div>
          <p className="hint">
            <AlertTriangle size={13} /> ABJ masih perlu ditingkatkan untuk
            mencapai target.
          </p>
        </div>
      </div>
    </section>
  );
}

function NewsSection() {
  return (
    <section className="section" id="informasi">
      <SectionTitle
        title="Informasi Terbaru"
        subtitle="Informasi, edukasi, dan pengumuman seputar kegiatan PSN."
        action={
          <a className="text-link" href="#informasi">
            Lihat Semua <ArrowRight size={14} />
          </a>
        }
      />
      <div className="news-grid">
        <article className="featured-news">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=85"
            alt="Kegiatan menjaga lingkungan"
          />
          <div className="featured-overlay">
            <span className="tag">EDUKASI</span>
            <small>12 Jul 2026</small>
            <h3>Jaga Lingkungan Bersama</h3>
            <p>
              Mulai dari rumah, lakukan 3M Plus dan periksa tempat penampungan
              air secara rutin untuk mencegah perkembangbiakan nyamuk.
            </p>
          </div>
        </article>
        <div className="news-list">
          {news.map((n, i) => (
            <article className="news-row" key={n.title}>
              <img src={n.image} alt="" />
              <div>
                <span className="tag muted-tag">{n.tag}</span>
                <small>{n.date}</small>
                <h3>{n.title}</h3>
                <p>{n.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Schedule() {
  return (
    <section className="section" id="jadwal">
      <SectionTitle
        title="Jadwal Kegiatan PSN"
        subtitle="Pantau jadwal pemeriksaan dan kegiatan pemberantasan sarang nyamuk."
        action={
          <a className="text-link" href="#jadwal">
            Lihat Kalender <ArrowRight size={14} />
          </a>
        }
      />
      <div className="schedule-grid">
        <div className="schedule-card">
          <div className="card-head">
            <b>
              <CalendarDays size={17} /> Jadwal Kegiatan PSN
            </b>
            <span>Juli 2026</span>
          </div>
          {schedule.map((s) => (
            <div className="schedule-row" key={s.day}>
              <div className="date-box">
                <b>{s.day}</b>
                <small>{s.month}</small>
              </div>
              <div className="schedule-info">
                <b>{s.title}</b>
                <small>{s.area}</small>
              </div>
              <span
                className={`status ${s.status === "Selesai" ? "done" : ""}`}
              >
                {s.status}
              </span>
            </div>
          ))}
        </div>
        <div className="activity-card">
          <div className="card-head">
            <b>
              <Users size={17} /> Dokumentasi Kegiatan
            </b>
            <span>Galeri PSN</span>
          </div>
          <div className="activity-image">
            <img
              src="https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&w=1000&q=85"
              alt="Kegiatan gotong royong"
            />
            <div>
              <b>Kader Jumantik bersama warga</b>
              <small>
                Kegiatan pemeriksaan dan pemberantasan sarang nyamuk
              </small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Beranda() {
  return (
    <>
      <Hero />
      <Profile />
      <MapSection />
      <Progress />
      <NewsSection />
      <Schedule />
      <button
        className="help-fab"
        title="Bantuan"
        onClick={() =>
          alert("Prototype Monitoring PSN Kelurahan Srengseng Sawah")
        }
      >
        <CircleHelp size={20} />
      </button>
    </>
  );
}
