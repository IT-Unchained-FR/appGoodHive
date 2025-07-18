import { NextResponse } from "next/server";

export function addSecurityHeaders(response: NextResponse): NextResponse {
  const isDevelopment = process.env.NODE_ENV === "development";

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    // Allow more flexible sources in development
    isDevelopment
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://apis.google.com https://accounts.google.com https://*.okto.tech"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://*.okto.tech",
    "style-src 'self' 'unsafe-inline' https://accounts.google.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    // Allow localhost in development for connect-src and add WalletConnect domains and Infura
    isDevelopment
      ? "connect-src 'self'  http://localhost:* https://*.okto.tech https://api.goodhive.io https://accounts.google.com https://explorer-api.walletconnect.com https://*.infura.io ws://localhost:* wss://relay.walletconnect.com wss://relay.walletconnect.org https://api.coingecko.com"
      : "connect-src 'self' https://*.okto.tech https://api.goodhive.io https://accounts.google.com https://explorer-api.walletconnect.com https://*.infura.io wss://relay.walletconnect.com wss://relay.walletconnect.org https://api.coingecko.com",
    // Add YouTube to frame-src
    "frame-src 'self' https://accounts.google.com https://verify.walletconnect.com https://www.youtube.com https://www.youtube-nocookie.com",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", cspDirectives);

  // Prevent clickjacking

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable strict SSL (only in production)
  if (!isDevelopment) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );

  return response;
}
