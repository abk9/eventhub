export default function StatCard({ number, label, color = '#4f46e5' }) {
  return (
    <div className="stat-card">
      <div className="stat-number" style={{ color }}>{number}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
