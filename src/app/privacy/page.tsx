import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — HearMeOuttt',
  description: 'Privacy Policy for HearMeOuttt, detailing how we handle data on our anonymous platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', fontFamily: 'inherit' }}>
      <Link 
        href="/" 
        style={{ 
          display: 'inline-block',
          marginBottom: '20px',
          color: 'var(--primary-button-bg)', 
          textDecoration: 'none', 
          fontWeight: '600' 
        }}
      >
        &larr; Back to Home
      </Link>

      <div style={{
        backgroundColor: 'var(--card-bg-color)',
        padding: '30px 40px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        color: 'var(--text-color)'
      }}>
        <h1 style={{ marginTop: '0', fontSize: '2em', marginBottom: '10px' }}>Privacy Policy — HearMeOuttt</h1>
        <p style={{ color: 'var(--text-secondary-color)', fontSize: '0.9em', marginBottom: '30px' }}>
          <strong>Last Updated:</strong> April 2026<br />
          <strong>Contact:</strong> project.hearmeouttt@gmail.com
        </p>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>1. Introduction</h2>
          <p style={{ lineHeight: '1.6' }}>
            HearMeOuttt is a safe, anonymous platform designed for users to share their thoughts, feelings, and daily experiences. This Privacy Policy outlines what information we collect, how we use it, and how we protect your anonymity.
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>2. What We Collect</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>Because we do not require account registration, the data we collect is minimal and focused on technical functionality:</p>
          <ul style={{ lineHeight: '1.6', paddingLeft: '20px', color: 'var(--text-secondary-color)' }}>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-color)' }}>Anonymous Session ID:</strong> A randomly generated identifier created by Firebase Auth. It is not linked to any real identity, email, or password.</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-color)' }}>Post Content:</strong> The text and thoughts you voluntarily submit to the platform.</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-color)' }}>Timestamps:</strong> The date and time of your activities (like posting or submitting feedback).</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-color)' }}>Browser User-Agent:</strong> The standard userAgent string from your browser, used strictly for abuse prevention.</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-color)' }}>IP Addresses:</strong> Handled entirely by our infrastructure providers (Vercel and Firebase). We do not directly store or log your IP address.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>3. What We Do NOT Collect</h2>
          <p style={{ lineHeight: '1.6' }}>
            We do not collect names, email addresses, phone numbers, precise geographic locations, or any other personally identifying information. 
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>4. How We Use Data</h2>
          <p style={{ lineHeight: '1.6' }}>
            The data we collect is used solely to display posts publicly on the feed, enforce rate limits (to prevent spam), detect abuse, and moderate content to maintain a safe environment.
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>5. Third-Party Services</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>We utilize the following third-party infrastructure to run HearMeOuttt:</p>
          <ul style={{ lineHeight: '1.6', paddingLeft: '20px', color: 'var(--text-secondary-color)' }}>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-color)' }}>Firebase (by Google):</strong> Used for anonymous authentication and database storage.</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-color)' }}>Vercel:</strong> Used for website hosting and backend infrastructure.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>6. Data Retention</h2>
          <p style={{ lineHeight: '1.6' }}>
            Posts remain on the platform indefinitely unless they are removed by our moderation system or upon your explicit request. Your anonymous session persists locally in your browser until you clear your browser data or cookies.
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>7. Your Rights</h2>
          <p style={{ lineHeight: '1.6' }}>
            You can delete your own posts directly on the site using the "My Posts" view, provided your browser session is active. <strong>Because HearMeOuttt is strictly anonymous, we have no way to verify your identity once your browser data is cleared.</strong> To prevent bad actors from maliciously deleting posts that do not belong to them, we cannot process manual deletion requests via email based on public information (like post time or content). We will only manually remove posts if they are reported and found to violate our Terms of Service.
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>8. GDPR Compliance</h2>
          <p style={{ lineHeight: '1.6' }}>
            Users in the European Union have the right to request access to or erasure of their data. However, because we do not collect any identifiable personal information, we cannot reliably verify which data belongs to you once your local session is lost (in accordance with GDPR Article 11). To exercise your right to erasure, you must delete your posts directly on the site while your session is still active.
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>9. COPPA (Children's Privacy)</h2>
          <p style={{ lineHeight: '1.6' }}>
            This service is not intended for users under the age of 13. If you are under 13, please do not use this service or submit any content to HearMeOuttt.
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>10. Changes to this Policy</h2>
          <p style={{ lineHeight: '1.6' }}>
            We may update this Privacy Policy from time to time. We will indicate the "Last Updated" date at the top of this page. Your continued use of HearMeOuttt after changes are made constitutes your acceptance of the updated policy.
          </p>
        </section>

        <section style={{ marginBottom: '0' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>11. Mental Health & Crisis Resources</h2>
          <p style={{ lineHeight: '1.6' }}>
            HearMeOuttt is not a substitute for professional mental health support. If you are in crisis, please reach out to a helpline. In India: iCall (9152987821). International Association for Suicide Prevention maintains a directory of crisis centers at <a href="https://www.iasp.info/resources/Crisis_Centres/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-button-bg)', textDecoration: 'none' }}>https://www.iasp.info/resources/Crisis_Centres/</a>.
          </p>
        </section>
      </div>
    </main>
  );
}