import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Sportsphere",
  description:
    "How Sportsphere collects, uses, and protects your information when you use the mobile app and sportssphere.fun website.",
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0A1628] text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
          <a href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-white/70 hover:text-[#F5C518] transition-colors">← Back to app</a>
        <header className="mb-12 border-b border-white/10 pb-8">
          <h1 className="font-sans text-4xl font-extrabold tracking-tight text-[#F5C518]">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-white/60">
            Last updated: 2026-08-09 · Effective date: 2026-08-09
          </p>
          <p className="mt-6 text-base leading-relaxed text-white/80">
            This Privacy Policy describes how Sportsphere (&ldquo;we&rdquo;,
            &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects, uses, and protects your
            information when you use the Sportsphere mobile application and the
            sportssphere.fun website (collectively, the &ldquo;Service&rdquo;). By
            creating an account or using the Service, you agree to the practices
            described below.
          </p>
        </header>

        <div className="space-y-10 text-base leading-relaxed text-white/85">
          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              1. Information We Collect
            </h2>
            <h3 className="mt-4 mb-2 text-lg font-semibold text-[#F5C518]">
              1.1 Information you provide
            </h3>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong className="text-white">Account information:</strong>{" "}
                full name, email address, username (handle), password (hashed at
                rest using Argon2id), and the role you select (Fan, Player,
                Coach, Team, Scout, Journalist, Creator, Analyst, Commentator,
                Agent, Organization, Competition, League, Academy, Venue,
                Business, Commercial-Partner, Community, Referee, Stadium,
                Medical, Developer).
              </li>
              <li>
                <strong className="text-white">Profile information:</strong>{" "}
                avatar, bio, favourite sports (1–3), and any role-specific
                profile fields you choose to fill (e.g. position, club,
                affiliation, country).
              </li>
              <li>
                <strong className="text-white">User-generated content:</strong>{" "}
                posts, predictions, polls, highlights, comments, likes, and
                direct messages you create.
              </li>
              <li>
                <strong className="text-white">Verification requests:</strong>{" "}
                documents you submit to support a verified status (Scout,
                Journalist, Athlete, Pro). Documents are reviewed by an admin
                and stored encrypted at rest.
              </li>
            </ul>
            <h3 className="mt-6 mb-2 text-lg font-semibold text-[#F5C518]">
              1.2 Information collected automatically
            </h3>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong className="text-white">Device identifiers:</strong> iOS
                Identifier for Advertisers (IDFA) where permitted, Android
                Advertising ID where permitted, and a stable per-install
                identifier used only for analytics and abuse prevention.
              </li>
              <li>
                <strong className="text-white">Usage data:</strong> screens
                viewed, taps, scroll depth, search queries, and feature usage
                events. We use this to improve relevance and detect abuse.
              </li>
              <li>
                <strong className="text-white">Crash and performance data:</strong>{" "}
                stack traces, memory pressure, and network error counts.
              </li>
              <li>
                <strong className="text-white">Push token:</strong> the APNs or
                FCM token assigned to your device so we can deliver
                notifications you have opted in to. The token is associated
                with your user ID and revoked on logout.
              </li>
            </ul>
            <h3 className="mt-6 mb-2 text-lg font-semibold text-[#F5C518]">
              1.3 Information from third parties
            </h3>
            <p>
              We do not currently integrate third-party sign-in (Sign in with
              Apple / Google) or social graph imports. If we add them, this
              section will be updated and consent will be requested at the time
              of connection.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              2. How We Use Your Information
            </h2>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong className="text-white">To provide the Service:</strong>{" "}
                create your account, render your feed, show your profile, and
                follow other users.
              </li>
              <li>
                <strong className="text-white">To compute rankings:</strong> the
                performance engine aggregates match events and verifications to
                compute your tier, global rank, and form / consistency /
                improvement scores. These scores are visible on your public
                profile.
              </li>
              <li>
                <strong className="text-white">To send notifications:</strong>{" "}
                push notifications for new followers, comments on your posts,
                mentions, rank changes, and verification updates. You can
                disable any notification type in the app&rsquo;s Settings
                screen.
              </li>
              <li>
                <strong className="text-white">To prevent abuse:</strong>{" "}
                rate-limit posting, detect duplicate or bot accounts, and
                enforce our Terms of Service.
              </li>
              <li>
                <strong className="text-white">To improve the Service:</strong>{" "}
                aggregate analytics on feature usage, crash rates, and API
                latency. We never sell your data.
              </li>
              <li>
                <strong className="text-white">Legal obligations:</strong>{" "}
                respond to lawful requests from public authorities where we are
                legally compelled to do so.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              3. Legal Basis (EEA / UK Users)
            </h2>
            <p>
              Where the GDPR applies, we process your personal data on the
              following legal bases:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong className="text-white">Performance of a contract</strong>{" "}
                (Art. 6(1)(b)) — to operate your account and deliver the
                features you signed up for.
              </li>
              <li>
                <strong className="text-white">Legitimate interests</strong>{" "}
                (Art. 6(1)(f)) — to prevent abuse, secure the Service, and
                aggregate analytics.
              </li>
              <li>
                <strong className="text-white">Consent</strong> (Art. 6(1)(a)) —
                for push notifications, IDFA / AAID tracking, and any optional
                analytics. You can withdraw consent at any time in Settings.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              4. Data Sharing
            </h2>
            <p>
              We do not sell your personal data. We share data only with the
              following categories of processors, under written contracts that
              limit their use of the data to providing services to us:
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/20 text-[#F5C518]">
                    <th className="py-2 pr-4">Processor</th>
                    <th className="py-2 pr-4">Purpose</th>
                    <th className="py-2">Region</th>
                  </tr>
                </thead>
                <tbody className="text-white/80">
                  <tr className="border-b border-white/10">
                    <td className="py-2 pr-4">Expo / EAS</td>
                    <td className="py-2 pr-4">
                      OTA update delivery, push notification delivery (APNs /
                      FCM), crash grouping
                    </td>
                    <td className="py-2">USA</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 pr-4">Apple APNs</td>
                    <td className="py-2 pr-4">iOS push notification delivery</td>
                    <td className="py-2">USA</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 pr-4">Google FCM</td>
                    <td className="py-2 pr-4">
                      Android push notification delivery
                    </td>
                    <td className="py-2">USA</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 pr-4">Hosting provider</td>
                    <td className="py-2 pr-4">
                      VPS hosting for the API and PostgreSQL database
                    </td>
                    <td className="py-2">Self-hosted (your VPS region)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Email provider (when added)</td>
                    <td className="py-2 pr-4">
                      Transactional email (verification, password reset)
                    </td>
                    <td className="py-2">TBD</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              We will disclose personal data to law enforcement only where
              legally required, and we will notify you in advance unless
              prohibited by law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              5. Data Retention
            </h2>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong className="text-white">Active accounts:</strong>{" "}
                retained for the lifetime of the account.
              </li>
              <li>
                <strong className="text-white">Deleted accounts:</strong>{" "}
                soft-deleted for 30 days (recoverable), then hard-deleted within
                90 days, except where retention is required by law (e.g.
                financial records, fraud investigations).
              </li>
              <li>
                <strong className="text-white">
                  Device logs and analytics:
                </strong>{" "}
                retained for 90 days, then aggregated and the raw data deleted.
              </li>
              <li>
                <strong className="text-white">Push tokens:</strong> revoked on
                logout and deleted within 24 hours.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              6. Your Rights
            </h2>
            <p>
              Depending on your jurisdiction, you may have the right to:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong className="text-white">Access</strong> a copy of your
                personal data
              </li>
              <li>
                <strong className="text-white">Rectify</strong> inaccurate or
                incomplete data
              </li>
              <li>
                <strong className="text-white">Erase</strong> your data (right to
                be forgotten)
              </li>
              <li>
                <strong className="text-white">Restrict or object</strong> to
                processing
              </li>
              <li>
                <strong className="text-white">Data portability</strong> —
                receive your data in a structured, machine-readable format
              </li>
              <li>
                <strong className="text-white">Withdraw consent</strong> at any
                time (for consent-based processing)
              </li>
              <li>
                <strong className="text-white">Lodge a complaint</strong> with
                your supervisory authority
              </li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, email{" "}
              <a
                href="mailto:privacy@sportssphere.fun"
                className="text-[#F5C518] underline underline-offset-4 hover:text-[#FF6B35]"
              >
                privacy@sportssphere.fun
              </a>{" "}
              from the email address registered on your account. We respond
              within 30 days.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">7. Security</h2>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong className="text-white">Passwords:</strong> hashed using
                Argon2id with a per-user salt.
              </li>
              <li>
                <strong className="text-white">JWT tokens:</strong> signed with
                a server-side secret, stored in iOS Keychain / Android Keystore
                (via <code className="text-[#F5C518]">expo-secure-store</code>),
                short-lived with refresh.
              </li>
              <li>
                <strong className="text-white">Transport:</strong> all API
                traffic is TLS-encrypted in production (HTTPS). A temporary HTTP
                endpoint is in use during development only and will be replaced
                with HTTPS before App Store submission.
              </li>
              <li>
                <strong className="text-white">Database:</strong> PostgreSQL
                with role-based access; only the application user has
                read/write, and only from the application host.
              </li>
              <li>
                <strong className="text-white">Audit log:</strong> all admin
                actions (user suspensions, role grants, KPI changes) are
                recorded in the <code className="text-[#F5C518]">AuditLog</code>{" "}
                table.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              8. Children&rsquo;s Privacy
            </h2>
            <p>
              The Service is not directed at children under 13 (under 16 in the
              EU). We do not knowingly collect personal data from children. If
              you believe we have collected information from a child, contact{" "}
              <a
                href="mailto:privacy@sportssphere.fun"
                className="text-[#F5C518] underline underline-offset-4 hover:text-[#FF6B35]"
              >
                privacy@sportssphere.fun
              </a>{" "}
              and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              9. International Transfers
            </h2>
            <p>
              Your data may be processed on servers located outside your country
              of residence. By using the Service, you consent to such transfers
              in accordance with this Privacy Policy. Where the GDPR applies, we
              rely on Standard Contractual Clauses for any transfers out of the
              EEA / UK.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">10. Cookies</h2>
            <p>
              The mobile app does not use cookies. The web app uses a single
              HttpOnly session cookie for authentication and does not use
              tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              11. Changes to this Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of material changes via an in-app banner or push
              notification at least 14 days before the new policy takes effect.
              The &ldquo;Last updated&rdquo; date at the top of this page
              reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">12. Contact</h2>
            <p>
              <strong className="text-white">
                Sportsphere — Data Protection
              </strong>
              <br />
              Email:{" "}
              <a
                href="mailto:privacy@sportssphere.fun"
                className="text-[#F5C518] underline underline-offset-4 hover:text-[#FF6B35]"
              >
                privacy@sportssphere.fun
              </a>
              <br />
              Web:{" "}
              <a
                href="/privacy"
                className="text-[#F5C518] underline underline-offset-4 hover:text-[#FF6B35]"
              >
                https://sportssphere.fun/privacy
              </a>
            </p>
            <p className="mt-4">
              For verification requests, account deletion, or data export,
              include your registered email address and a description of your
              request.
            </p>
          </section>
        </div>

        <footer className="mt-16 border-t border-white/10 pt-8 text-sm text-white/50">
          <p>
            See also:{" "}
            <a
              href="/terms"
              className="text-[#F5C518] underline underline-offset-4 hover:text-[#FF6B35]"
            >
              Terms of Service
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
