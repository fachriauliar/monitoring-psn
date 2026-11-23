
import { Construction } from "lucide-react";
import "../assets/styles/PlaceholderPage.css";

function PlaceholderPage({ title, description }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-content">
        <div className="placeholder-icon">
          <Construction size={34} />
        </div>

        <span className="placeholder-badge">
          Halaman dalam Pengembangan
        </span>

        <h1>{title}</h1>

        <p>{description}</p>

        <div className="placeholder-divider" />

        <span className="placeholder-footer">
          Website Monitoring PSN dan Jumantik
          <br />
          Kelurahan Srengseng Sawah
        </span>
      </div>
    </div>
  );
}

export default PlaceholderPage;
