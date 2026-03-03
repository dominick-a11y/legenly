import React from 'react';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
    <div className="text-gray-400 space-y-3 leading-relaxed">{children}</div>
  </div>
);

export default function Privacy() {
  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Effective date: March 3, 2026</p>
        </div>

        <p className="text-gray-400 mb-10 leading-relaxed">
          Legenly ("we," "us," or "our") operates the platform at legenly.io. This Privacy Policy explains
          what information we collect, how we use it, and your rights regarding that information.
          By using our platform, you agree to the practices described here.
        </p>

        <Section title="1. Information We Collect">
          <p><strong className="text-white">From homeowners and consumers</strong> — When you submit a junk removal quote request through our lead form or Facebook/Instagram ads, we collect your name, phone number, email address, city, state, job type, and job description.</p>
          <p><strong className="text-white">From contractors (subscribers)</strong> — When you register for a Legenly account, we collect your name, email address, business name, territory, and payment information processed by Stripe. We do not store your full card number.</p>
          <p><strong className="text-white">Automatically</strong> — We collect standard web server logs including IP addresses, browser type, and pages visited. We may use cookies or similar technologies for session management.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Deliver lead data to the exclusive contractor serving your area</li>
            <li>Send SMS notifications to contractors about new leads (via Twilio)</li>
            <li>Process subscription payments (via Stripe)</li>
            <li>Communicate with contractors about their account and territory</li>
            <li>Improve and operate the Legenly platform</li>
            <li>Comply with legal obligations</li>
          </ul>
        </Section>

        <Section title="3. How We Share Your Information">
          <p>We do not sell your personal information.</p>
          <p><strong className="text-white">Lead data</strong> — Consumer lead information (name, phone, email, job details) is shared exclusively with the single licensed contractor assigned to that geographic territory.</p>
          <p><strong className="text-white">Service providers</strong> — We share data with trusted third-party services that help us operate the platform:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Stripe — payment processing</li>
            <li>Twilio — SMS delivery</li>
            <li>Meta (Facebook/Instagram) — lead generation advertising</li>
            <li>Zapier — lead routing automation</li>
            <li>Railway — cloud hosting</li>
          </ul>
          <p>These providers have their own privacy policies and are contractually required to protect your data.</p>
          <p><strong className="text-white">Legal requirements</strong> — We may disclose information if required by law or to protect the rights and safety of our users.</p>
        </Section>

        <Section title="4. Data Retention">
          <p>We retain lead data for as long as necessary to deliver the service and for reasonable business recordkeeping. Contractor account data is retained for the duration of the subscription and a reasonable period after cancellation. You may request deletion of your data at any time by contacting us.</p>
        </Section>

        <Section title="5. Security">
          <p>We use industry-standard measures to protect your information, including encrypted connections (HTTPS) and secure credential storage. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
        </Section>

        <Section title="6. Your Rights">
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt out of marketing communications</li>
          </ul>
          <p>To exercise any of these rights, contact us at the email below.</p>
        </Section>

        <Section title="7. Children's Privacy">
          <p>Legenly is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from children.</p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes by email or in-app notice. The effective date at the top of this page reflects the most recent update.</p>
        </Section>

        <Section title="9. Contact Us">
          <p>If you have questions or concerns about this Privacy Policy, contact us at:</p>
          <p>
            <strong className="text-white">Legenly</strong><br />
            Email: <a href="mailto:hello@legenly.io" className="text-emerald-400 hover:underline">hello@legenly.io</a>
          </p>
        </Section>
      </div>
    </div>
  );
}
