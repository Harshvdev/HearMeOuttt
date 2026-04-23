import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — HearMeOuttt',
  description: 'Terms of Service and usage guidelines for HearMeOuttt.',
};

export default function TermsOfServicePage() {
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
        <h1 style={{ marginTop: '0', fontSize: '2em', marginBottom: '10px' }}>Terms of Service — HearMeOuttt</h1>
        <p style={{ color: 'var(--text-secondary-color)', fontSize: '0.9em', marginBottom: '30px' }}>
          <strong>Last Updated:</strong> April 2026<br />
          <strong>Contact:</strong> project.hearmeouttt@gmail.com
        </p>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>1. Agreement to Terms</h2>
          <p style={{ lineHeight: '1.6' }}>
            By accessing or using HearMeOuttt, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>2. Age Requirement</h2>
          <p style={{ lineHeight: '1.6' }}>
            You must be at least 13 years old to access or use HearMeOuttt. By using the platform, you confirm that you meet this minimum age requirement.
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>3. What HearMeOuttt Is</h2>
          <p style={{ lineHeight: '1.6' }}>
            HearMeOuttt is an anonymous online space designed for sharing thoughts, venting, and expressing feelings freely. No user accounts, passwords, or personal registrations are required to use the service.
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>4. Prohibited Content</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>While we encourage free expression, certain content is strictly prohibited. You may <strong>NOT</strong> post:</p>
          <ul style={{ lineHeight: '1.6', paddingLeft: '20px', color: 'var(--text-secondary-color)' }}>
            <li style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-color)' }}>Threats of violence or content intended to physically harm anyone.</span></li>
            <li style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-color)' }}>Harassment, hate speech, or content targeting individuals/groups based on identity.</span></li>
            <li style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-color)' }}>Sexually explicit or pornographic material.</span></li>
            <li style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-color)' }}>Child sexual abuse material (CSAM) — instances will be immediately reported to appropriate legal authorities.</span></li>
            <li style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-color)' }}>Personal information of others without their consent (doxxing).</span></li>
            <li style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-color)' }}>Spam, advertising, or commercial solicitation.</span></li>
            <li style={{ marginBottom: '8px' }}><span style={{ color: 'var(--text-color)' }}>Any content that violates applicable local, national, or international laws.</span></li>
          </ul>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>5. Content Moderation</h2>
          <p style={{ lineHeight: '1.6' }}>
            We employ both automated moderation systems (including OpenAI's moderation API) and human review to detect and remove violating content. We reserve the right to remove any post, at any time, for any reason, without prior notice.
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>6. Your Content</h2>
          <p style={{ lineHeight: '1.6' }}>
            By posting content on HearMeOuttt, you grant us a license to store, display, and distribute that content on our platform. You retain your anonymity, but you are solely responsible for the content you choose to post.
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>7. No Liability</h2>
          <p style={{ lineHeight: '1.6' }}>
            HearMeOuttt is provided on an "as is" and "as available" basis. We make no warranties regarding platform uptime or reliability. We are not liable for user-generated content, service interruptions, data loss, or any direct/indirect damages arising from your use of the platform.
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>8. Service Changes</h2>
          <p style={{ lineHeight: '1.6' }}>
            We reserve the right to modify, suspend, or discontinue HearMeOuttt (or any part of it) at any time without prior notice.
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>9. Governing Law</h2>
          <p style={{ lineHeight: '1.6' }}>
            These terms are governed by and construed in accordance with the laws of India, without regard to its conflict of law principles.
          </p>
        </section>

        <section style={{ marginBottom: '0' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>10. Contact Us</h2>
          <p style={{ lineHeight: '1.6' }}>
            If you have any questions about these Terms of Service or need to report a severe violation, please contact us at <a href="mailto:project.hearmeouttt@gmail.com" style={{ color: 'var(--primary-button-bg)', textDecoration: 'none' }}>project.hearmeouttt@gmail.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}