export default function BlockedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0e1619' }}>
      <div className="text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-white/40">You are not authorized to access this application.</p>
      </div>
    </div>
  );
}
