import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Sportsphere",
  description:
    "The terms and conditions that govern your use of the Sportsphere mobile app and sportssphere.fun website.",
  robots: { index: true, follow: true },
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[#0A1628] text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
          <a href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-white/70 hover:text-[#F5C518] transition-colors">← Back to app</a>
        <header className="mb-12 border-b border-white/10 pb-8">
          <h1 className="font-sans text-4xl font-extrabold tracking-tight text-[#F5C518]">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-white/60">
            Last updated: 2026-08-09 · Effective date: 2026-08-09
          </p>
          <p className="mt-6 text-base leading-relaxed text-white/80">
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the
            Sportsphere mobile application, the sportssphere.fun website, and any
            related services (collectively, the &ldquo;Service&rdquo;). By
            creating an account or using the Service, you agree to these Terms.
            If you do not agree, do not use the Service.
          </p>
        </header>

        <div className="space-y-10 text-base leading-relaxed text-white/85">
          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              1. Eligibility
            </h2>
            <p>
              You must be at least 13 years old (16 in the European Union) to
              create an account. By creating an account, you represent that you
              meet this age requirement and are legally able to enter into a
              binding agreement.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              2. Your Account
            </h2>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                You must provide accurate, current information at registration
                and keep it up to date.
              </li>
              <li>
                You are responsible for safeguarding your password and for all
                activity under your account.
              </li>
              <li>
                You may not create an account on behalf of another person
                without their written permission.
              </li>
              <li>
                One person, one account. Creating multiple accounts to
                manipulate rankings, likes, or follower counts is prohibited
                and may result in suspension.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              3. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                Post content that is illegal, defamatory, harassing, hateful,
                threatening, or that incites violence;
              </li>
              <li>
                Post sexually explicit content, particularly involving minors;
              </li>
              <li>
                Impersonate another person, brand, or organisation, or falsely
                claim a verified status;
              </li>
              <li>
                Spam, including unsolicited mentions, mass-DM campaigns, or
                coordinated inauthentic behaviour;
              </li>
              <li>
                Manipulate the performance engine, rankings, or polls (e.g.
                fake match events, coordinated voting, bot accounts);
              </li>
              <li>
                Scrape, crawl, or otherwise extract data from the Service
                without our written permission;
              </li>
              <li>
                Attempt to disrupt, overload, or reverse-engineer the Service,
                its API, or its infrastructure;
              </li>
              <li>
                Post another person&rsquo;s private information (doxxing)
                without their consent;
              </li>
              <li>
                Sell, transfer, or sublicense your account to a third party.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              4. User-Generated Content
            </h2>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                You retain ownership of content you post. By posting, you grant
                Sportsphere a worldwide, non-exclusive, royalty-free licence to
                host, store, reproduce, and display that content for the
                purpose of operating the Service.
              </li>
              <li>
                You are solely responsible for the content you post and for
                ensuring you have the rights to post it.
              </li>
              <li>
                We may remove any content that violates these Terms or that we
                believe is harmful to the community.
              </li>
              <li>
                We do not endorse and are not responsible for user-generated
                content. The views of users do not represent the views of
                Sportsphere.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              5. Performance Engine &amp; Rankings
            </h2>
            <p>
              Sportsphere computes a performance score, tier, and global rank
              for verified athletes, coaches, and teams based on match events,
              peer verifications, and time-weighted recency. You acknowledge
              that:
            </p>
            <ul className="ml-6 list-disc space-y-2">
              <li>Rankings are algorithmic and may change without notice;</li>
              <li>
                We do not guarantee the accuracy or fairness of rankings;
              </li>
              <li>
                Tampering with the performance engine (fake events, coordinated
                verifications, etc.) is a material breach of these Terms;
              </li>
              <li>
                Rankings are a community signal, not an authoritative measure of
                athletic ability.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              6. Verification
            </h2>
            <p>
              Verified badges are granted at Sportsphere&rsquo;s discretion
              based on identity, role, and public prominence. Submitting false
              documentation to obtain a verified badge is a material breach of
              these Terms and will result in immediate account suspension.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              7. Pro Accounts
            </h2>
            <p>
              When launched, Pro accounts will offer additional features for a
              recurring subscription billed through Apple&rsquo;s App Store or
              Google&rsquo;s Play Store. Subscriptions auto-renew unless
              cancelled at least 24 hours before the renewal date. You can
              manage or cancel your subscription at any time in your
              device&rsquo;s store settings.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              8. Intellectual Property
            </h2>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                The Service, including its design, brand, code, and underlying
                performance engine, is the property of Sportsphere and is
                protected by intellectual property laws.
              </li>
              <li>
                The Sportsphere name, logo, and &ldquo;S&rdquo; monogram are
                trademarks of Sportsphere.
              </li>
              <li>
                You may not use our trademarks, brand assets, or confusingly
                similar marks without our written permission.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              9. Disclaimers
            </h2>
            <p>
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
              AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
              IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
              UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              10. Limitation of Liability
            </h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SPORTSPHERE AND ITS
              AFFILIATES, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
              DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT
              OF OR RELATED TO THE SERVICE, WHETHER BASED ON WARRANTY,
              CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY,
              EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              11. Indemnification
            </h2>
            <p>
              You agree to indemnify and hold Sportsphere harmless from any
              claims, damages, losses, and expenses (including reasonable legal
              fees) arising out of your content, your breach of these Terms, or
              your violation of any law or third-party rights.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              12. Termination
            </h2>
            <p>
              You may delete your account at any time in the app&rsquo;s
              Settings screen. We may suspend or terminate your account at any
              time, with or without cause, and with or without notice. Upon
              termination, your right to use the Service ceases immediately.
              Sections that by their nature should survive termination (e.g.
              intellectual property, disclaimers, indemnification) will
              survive.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              13. Governing Law
            </h2>
            <p>
              These Terms are governed by the laws of the jurisdiction in which
              Sportsphere is established, without regard to conflict-of-law
              principles. You consent to the exclusive jurisdiction of the
              courts of that jurisdiction for any dispute arising out of or
              relating to these Terms or the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              14. Dispute Resolution
            </h2>
            <p>
              Before filing a claim, you agree to attempt informal resolution by
              emailing{" "}
              <a
                href="mailto:legal@sportssphere.fun"
                className="text-[#F5C518] underline underline-offset-4 hover:text-[#FF6B35]"
              >
                legal@sportssphere.fun
              </a>{" "}
              with a description of the dispute. If we cannot resolve the
              dispute within 30 days, either party may proceed to formal
              resolution.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">
              15. Changes to these Terms
            </h2>
            <p>
              We may update these Terms from time to time. We will notify you of
              material changes via an in-app banner or push notification at
              least 14 days before the new Terms take effect. Your continued use
              of the Service after the effective date constitutes acceptance of
              the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-bold text-white">16. Contact</h2>
            <p>
              <strong className="text-white">Sportsphere — Legal</strong>
              <br />
              Email:{" "}
              <a
                href="mailto:legal@sportssphere.fun"
                className="text-[#F5C518] underline underline-offset-4 hover:text-[#FF6B35]"
              >
                legal@sportssphere.fun
              </a>
              <br />
              Web:{" "}
              <a
                href="/terms"
                className="text-[#F5C518] underline underline-offset-4 hover:text-[#FF6B35]"
              >
                https://sportssphere.fun/terms
              </a>
            </p>
            <p className="mt-4">
              If you have a question about these Terms, an account issue, or a
              content takedown request, include your registered email and a
              clear description of the issue.
            </p>
          </section>
        </div>

        <footer className="mt-16 border-t border-white/10 pt-8 text-sm text-white/50">
          <p>
            See also:{" "}
            <a
              href="/privacy"
              className="text-[#F5C518] underline underline-offset-4 hover:text-[#FF6B35]"
            >
              Privacy Policy
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
