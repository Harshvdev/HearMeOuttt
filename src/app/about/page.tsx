import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — HearMeOuttt',
  description: 'Learn about HearMeOuttt, our mission, and why we built an anonymous platform without likes or comments.',
};

export default function AboutPage() {
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
        <h1 style={{ marginTop: '0', fontSize: '2em', marginBottom: '30px' }}>About HearMeOuttt</h1>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>What is HearMeOuttt?</h2>
          <p style={{ lineHeight: '1.6' }}>
            HearMeOuttt is a completely anonymous, judgment-free space to share your thoughts, feelings, and daily experiences. There are no accounts, no passwords, and no profiles to set up. It’s simply a safe corner of the internet where you can speak your mind and let your voice be heard.
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>Why are there no likes or comments?</h2>
          <p style={{ lineHeight: '1.6' }}>
            This is a very intentional design choice. Traditional social media mechanics—like likes, comments, and follower counts—create an immense pressure to perform. They introduce a fear of judgment and turn genuine expression into a competition for validation. 
            <br /><br />
            By entirely removing social validation metrics, HearMeOuttt ensures that every thought is treated equally. You can express your feelings without worrying about engagement.
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>How it Works</h2>
          <ul style={{ lineHeight: '1.6', paddingLeft: '20px', color: 'var(--text-secondary-color)' }}>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-color)' }}>True Anonymity:</strong> We do not ask for or store your personal information.</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-color)' }}>5-Minute Cooldown:</strong> To encourage thoughtful sharing and prevent spam, there is a short waiting period between posts.</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-color)' }}>Community Moderation:</strong> The feed is kept safe by you. If a post violates our guidelines, users can report it. Posts that reach a threshold of reports are automatically hidden from the feed.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>Who Runs It?</h2>
          <p style={{ lineHeight: '1.6' }}>
            HearMeOuttt is created and maintained by a solo developer building in public. The goal is to provide a healthier, pressure-free alternative to modern social media.
          </p>
        </section>

        <section style={{ marginBottom: '0' }}>
          <h2 style={{ fontSize: '1.4em', marginBottom: '10px' }}>Contact</h2>
          <p style={{ lineHeight: '1.6' }}>
            Have feedback, found a bug, or just want to say hi? Reach out at <a href="mailto:project.hearmeouttt@gmail.com" style={{ color: 'var(--primary-button-bg)', textDecoration: 'none' }}>project.hearmeouttt@gmail.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}