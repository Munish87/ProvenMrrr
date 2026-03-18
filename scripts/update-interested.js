const fs = require('fs');
let c = fs.readFileSync('h:/vetra - Copy/app/dashboard/interested/page.tsx', 'utf8');
c = c.replace(
  '<div className="startup-card-logo" style={{ width: 44, height: 44, fontSize: 18, borderRadius: 10 }}>',
  '<div className="startup-card-logo" style={{ width: 44, height: 44, fontSize: 18, borderRadius: 10, filter: startup.is_anonymous ? "blur(5px)" : "none" }}>'
);
c = c.replace(
  '<img src={startup.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />',
  '<img src={startup.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: startup.is_anonymous ? "blur(8px)" : "none" }} />'
);
c = c.replace(
  '<p style={{ fontSize: 13, color: "var(--color-secondary)", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>',
  '<p style={{ fontSize: 13, color: "var(--color-secondary)", display: "flex", alignItems: "center", gap: 6, fontWeight: 500, filter: startup.is_anonymous ? "blur(4px)" : "none" }}>'
);
fs.writeFileSync('h:/vetra - Copy/app/dashboard/interested/page.tsx', c);
