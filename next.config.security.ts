import type { NextConfig } from 'next';

/**
 * Next.js config with security headers.
 *
 * MERGE this with your existing next.config.ts — don't replace it. Your
 * existing config has the `images.remotePatterns` setup which is critical
 * for Firebase Storage and (after the media page is added) YouTube
 * thumbnails.
 *
 * Each header is documented inline. If a header breaks something on your
 * site, comment it out and figure out why before removing — most of these
 * defend against real attacks, not just lint warnings.
 */

const nextConfig: NextConfig = {
  // -----------------------------------------------------------------
  // Existing image config — keep as-is
  // -----------------------------------------------------------------
  images: {
    remotePatterns: [
      // Firebase Storage public URLs
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      // YouTube thumbnails (for the media page's featured video facade)
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },

  // -----------------------------------------------------------------
  // Security headers
  // -----------------------------------------------------------------
  async headers() {
    return [
      {
        // Apply to every route — public pages, dashboard, API routes
        source: '/:path*',
        headers: [
          // ---------------------------------------------------------
          // X-Frame-Options: prevents clickjacking
          // ---------------------------------------------------------
          // Without this, an attacker could put your admin login page
          // inside an iframe on a malicious site, dim it to invisible,
          // and trick a logged-in admin into clicking buttons.
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },

          // ---------------------------------------------------------
          // X-Content-Type-Options: defends against MIME-sniffing XSS
          // ---------------------------------------------------------
          // Forces the browser to trust your declared Content-Type header
          // instead of guessing from file content. Closes a class of
          // attacks where uploaded files (e.g. fake images that are
          // actually JS) get executed.
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },

          // ---------------------------------------------------------
          // Referrer-Policy: controls what gets leaked in the Referer header
          // ---------------------------------------------------------
          // 'strict-origin-when-cross-origin' is the safe modern default.
          // It sends the FULL referrer when navigating within your own site,
          // but only the origin (not the path or query) to other domains.
          // Prevents accidental leakage of session info in URLs.
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },

          // ---------------------------------------------------------
          // Permissions-Policy: disables browser features the site doesn't use
          // ---------------------------------------------------------
          // If an XSS bug ever lets attacker code run, this prevents that
          // code from accessing the camera, microphone, or geolocation.
          // Adjust if your school site genuinely uses any of these.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },

          // ---------------------------------------------------------
          // Strict-Transport-Security: enforce HTTPS for a year
          // ---------------------------------------------------------
          // ⚠️ ONLY ENABLE THIS AFTER:
          //   1. Your domain serves HTTPS correctly in production
          //   2. You're sure you'll keep serving HTTPS — this is hard to
          //      reverse (browsers cache the policy for max-age, so users
          //      who visited once will refuse HTTP for a year)
          //
          // Comment it out for the first deploy. Once you've verified
          // HTTPS works for a few days, uncomment.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },

          // ---------------------------------------------------------
          // X-XSS-Protection: legacy header, mostly historical
          // ---------------------------------------------------------
          // Modern browsers ignore this in favor of CSP, but older
          // browsers respect it. Cheap to add.
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },

          // ---------------------------------------------------------
          // Content-Security-Policy (CSP) — NOT included by default
          // ---------------------------------------------------------
          // CSP is the strongest defense against XSS. But it's also the
          // most fragile — one wrong directive and your entire site
          // breaks. Tailwind, Next.js Image, and Firebase Auth all need
          // specific allowances.
          //
          // I'm intentionally NOT including a CSP here because writing
          // one for your specific stack requires knowing exactly which
          // domains/scripts you load, and getting it wrong silently
          // breaks things in confusing ways.
          //
          // When you're ready: deploy in "report-only" mode first
          // (Content-Security-Policy-Report-Only header), watch the
          // browser console for violations for a week, fix them, then
          // promote to enforcement mode.
          //
          // Resources for writing CSP:
          //   https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
          //   https://csp-evaluator.withgoogle.com/
        ],
      },
    ];
  },
};

export default nextConfig;
