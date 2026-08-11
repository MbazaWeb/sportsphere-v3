# Sportsphere — Privacy Policy

**Last updated:** 2026-08-09
**Effective date:** 2026-08-09

This Privacy Policy describes how Sportsphere ("we", "us", "our") collects, uses, and protects your information when you use the Sportsphere mobile application and the sportssphere.fun website (collectively, the "Service"). By creating an account or using the Service, you agree to the practices described below.

## 1. Information We Collect

### 1.1 Information you provide
- **Account information:** full name, email address, username (handle), password (hashed at rest using Argon2id), and the role you select (Fan, Player, Coach, Team, Scout, Journalist, Creator, Analyst, Commentator, Agent, Organization, Competition, League, Academy, Venue, Business, Commercial-Partner, Community, Referee, Stadium, Medical, Developer).
- **Profile information:** avatar, bio, favourite sports (1–3), and any role-specific profile fields you choose to fill (e.g. position, club, affiliation, country).
- **User-generated content:** posts, predictions, polls, highlights, comments, likes, and direct messages you create.
- **Verification requests:** documents you submit to support a verified status (Scout, Journalist, Athlete, Pro). Documents are reviewed by an admin and stored encrypted at rest.

### 1.2 Information collected automatically
- **Device identifiers:** iOS Identifier for Advertisers (IDFA) where permitted, Android Advertising ID where permitted, and a stable per-install identifier used only for analytics and abuse prevention.
- **Usage data:** screens viewed, taps, scroll depth, search queries, and feature usage events. We use this to improve relevance and detect abuse.
- **Crash and performance data:** stack traces, memory pressure, and network error counts.
- **Push token:** the APNs or FCM token assigned to your device so we can deliver notifications you have opted in to. The token is associated with your user ID and revoked on logout.

### 1.3 Information from third parties
We do not currently integrate third-party sign-in (Sign in with Apple / Google) or social graph imports. If we add them, this section will be updated and consent will be requested at the time of connection.

## 2. How We Use Your Information

- **To provide the Service:** create your account, render your feed, show your profile, and follow other users.
- **To compute rankings:** the performance engine aggregates match events and verifications to compute your tier, global rank, and form / consistency / improvement scores. These scores are visible on your public profile.
- **To send notifications:** push notifications for new followers, comments on your posts, mentions, rank changes, and verification updates. You can disable any notification type in the app's Settings screen.
- **To prevent abuse:** rate-limit posting, detect duplicate or bot accounts, and enforce our Terms of Service.
- **To improve the Service:** aggregate analytics on feature usage, crash rates, and API latency. We never sell your data.
- **Legal obligations:** respond to lawful requests from public authorities where we are legally compelled to do so.

## 3. Legal Basis (EEA / UK Users)

Where the GDPR applies, we process your personal data on the following legal bases:
- **Performance of a contract** (Art. 6(1)(b)) — to operate your account and deliver the features you signed up for.
- **Legitimate interests** (Art. 6(1)(f)) — to prevent abuse, secure the Service, and aggregate analytics.
- **Consent** (Art. 6(1)(a)) — for push notifications, IDFA / AAID tracking, and any optional analytics. You can withdraw consent at any time in Settings.

## 4. Data Sharing

We do not sell your personal data. We share data only with the following categories of processors, under written contracts that limit their use of the data to providing services to us:

| Processor | Purpose | Region |
|---|---|---|
| **Expo / EAS** | OTA update delivery, push notification delivery (APNs / FCM), crash grouping | USA |
| **Apple APNs** | iOS push notification delivery | USA |
| **Google FCM** | Android push notification delivery | USA |
| **Hosting provider** | VPS hosting for the API and PostgreSQL database | Self-hosted (your VPS region) |
| **Email provider** (when added) | Transactional email (verification, password reset) | TBD |

We will disclose personal data to law enforcement only where legally required, and we will notify you in advance unless prohibited by law.

## 5. Data Retention

- **Active accounts:** retained for the lifetime of the account.
- **Deleted accounts:** soft-deleted for 30 days (recoverable), then hard-deleted within 90 days, except where retention is required by law (e.g. financial records, fraud investigations).
- **Device logs and analytics:** retained for 90 days, then aggregated and the raw data deleted.
- **Push tokens:** revoked on logout and deleted within 24 hours.

## 6. Your Rights

Depending on your jurisdiction, you may have the right to:
- **Access** a copy of your personal data
- **Rectify** inaccurate or incomplete data
- **Erase** your data (right to be forgotten)
- **Restrict or object** to processing
- **Data portability** — receive your data in a structured, machine-readable format
- **Withdraw consent** at any time (for consent-based processing)
- **Lodge a complaint** with your supervisory authority

To exercise any of these rights, email **privacy@sportssphere.fun** from the email address registered on your account. We respond within 30 days.

## 7. Security

- **Passwords:** hashed using Argon2id with a per-user salt.
- **JWT tokens:** signed with a server-side secret, stored in iOS Keychain / Android Keystore (via `expo-secure-store`), short-lived with refresh.
- **Transport:** all API traffic is TLS-encrypted in production (HTTPS). A temporary HTTP endpoint is in use during development only and will be replaced with HTTPS before App Store submission.
- **Database:** PostgreSQL with role-based access; only the application user has read/write, and only from the application host.
- **Audit log:** all admin actions (user suspensions, role grants, KPI changes) are recorded in the `AuditLog` table.

## 8. Children's Privacy

The Service is not directed at children under 13 (under 16 in the EU). We do not knowingly collect personal data from children. If you believe we have collected information from a child, contact **privacy@sportssphere.fun** and we will delete it.

## 9. International Transfers

Your data may be processed on servers located outside your country of residence. By using the Service, you consent to such transfers in accordance with this Privacy Policy. Where the GDPR applies, we rely on Standard Contractual Clauses for any transfers out of the EEA / UK.

## 10. Cookies

The mobile app does not use cookies. The web app uses a single HttpOnly session cookie for authentication and does not use tracking cookies.

## 11. Changes to this Policy

We may update this Privacy Policy from time to time. We will notify you of material changes via an in-app banner or push notification at least 14 days before the new policy takes effect. The "Last updated" date at the top of this page reflects the most recent revision.

## 12. Contact

**Sportsphere — Data Protection**
Email: **privacy@sportssphere.fun**
Web: **https://sportssphere.fun/privacy**

For verification requests, account deletion, or data export, include your registered email address and a description of your request.
