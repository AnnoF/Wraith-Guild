/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Le site n'utilise jamais next/image (que des <img> classiques) : on
  // désactive l'optimiseur d'images intégré, qui embarque `sharp` (CVEs
  // récurrentes). Aucune perte fonctionnelle, ça neutralise juste un
  // chemin de code jamais emprunté ici.
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ];
  }
};
module.exports = nextConfig;
