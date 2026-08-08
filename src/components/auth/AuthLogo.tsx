'use client';

export function AuthLogo() {
  return (
    <div className="flex justify-center mb-6">
      <img
        src="/sportsphere/logo-wordmark.svg"
        alt="SportSphere"
        style={{ height: 36, width: 'auto', display: 'block' }}
        onError={(e) => {
          // Fallback: text logo if SVG fails
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
}
