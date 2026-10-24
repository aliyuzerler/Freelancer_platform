import Link from 'next/link';

/**
 * Global fallback for URLs that resolve outside any locale segment (the
 * middleware routes everything else into /[locale]). Rendered inside the
 * pass-through root layout, so it must ship its own <html> shell.
 */
export default function GlobalNotFound() {
  return (
    <html lang="tr">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#060a14', color: '#e6e9f0' }}>
        <div
          style={{
            display: 'flex',
            minHeight: '70vh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 60, fontWeight: 700, color: '#2e5bf0' }}>404</p>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Sayfa bulunamadı</h1>
          <p style={{ maxWidth: 420, opacity: 0.7 }}>
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
          <Link
            href="/tr"
            style={{ color: '#2e5bf0', fontWeight: 600, textDecoration: 'none' }}
          >
            Ana sayfaya dön
          </Link>
        </div>
      </body>
    </html>
  );
}
