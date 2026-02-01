'use client';

import React, { useEffect, useState, useRef, FormEvent } from 'react';
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  serverTimestamp, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  limit, 
  startAfter, 
  writeBatch, 
  runTransaction, 
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// --- Constants ---
const MAX_CHARS = 1200;
const POST_COOLDOWN_SECONDS = 300;
const FEEDBACK_COOLDOWN_SECONDS = 180;
const POSTS_PER_PAGE = 15;
const HIDE_THRESHOLD = 5;

const COLLECTIONS = {
  POSTS_PRIVATE: 'posts',
  POSTS_PUBLIC: 'posts_public',
  USER_ACTIVITY: 'user_activity',
  BUG_REPORTS: 'bug-reports',
  FEATURE_SUGGESTIONS: 'feature-suggestions'
};

const STORAGE_KEYS = {
  THEME: 'theme',
  LAST_POST_TIMESTAMP: 'lastPostTimestamp',
  REPORTED_POSTS: 'reportedPosts',
  MY_POST_IDS: 'myPostIds',
  LAST_BUG_TIMESTAMP: 'lastBugReportTimestamp',
  LAST_FEATURE_TIMESTAMP: 'lastFeatureSuggestionTimestamp'
};

// --- Types ---
interface PostData {
  id: string;
  content: string;
  timestamp: Timestamp | null;
  reportCount: number;
  isImmune?: boolean;
  authorId?: string;
  isMyPost?: boolean;
}

export default function Home() {
  // --- State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Post State
  const [postContent, setPostContent] = useState('');
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [allPostsLoaded, setAllPostsLoaded] = useState(false);
  const [lastVisiblePost, setLastVisiblePost] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isMyPostsMode, setIsMyPostsMode] = useState(false);
  const [reportedPosts, setReportedPosts] = useState<string[]>([]);
  const [myPostIds, setMyPostIds] = useState<string[]>([]);

  // UI State
  const [shareBtnDisabled, setShareBtnDisabled] = useState(true); // Initially disabled until auth
  const [shareBtnText, setShareBtnText] = useState('Share Anonymously');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'error' | 'success' | '' }>({ text: '', type: '' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature'>('bug');
  const [feedbackText, setFeedbackText] = useState('');
  const [modalStatus, setModalStatus] = useState<{ text: string; type: string }>({ text: '', type: '' });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // --- Effects ---

  // 1. Authentication & Initial Load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setShareBtnDisabled(false);
      } else {
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed:", error);
          showFeedback('Could not connect to service. Please refresh.', 'error');
        });
      }
    });

    // Load Local Storage Data
    const savedTheme = (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedReports = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTED_POSTS) || '[]');
    setReportedPosts(savedReports);

    const savedMyPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.MY_POST_IDS) || '[]');
    setMyPostIds(savedMyPosts);

    // Initial Fetch
    fetchPosts();

    return () => unsubscribe();
  }, []);

  // 2. Infinite Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      if (isMyPostsMode || isLoadingPosts || allPostsLoaded) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 250) {
        fetchPosts();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingPosts, allPostsLoaded, isMyPostsMode, lastVisiblePost]);

  // 3. Update Body Class for CSS filtering (legacy support for global.css)
  useEffect(() => {
    if (isMyPostsMode) {
      document.body.classList.add('my-posts-view');
    } else {
      document.body.classList.remove('my-posts-view');
    }
  }, [isMyPostsMode]);


  // --- Logic Functions ---

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
  };

  const showFeedback = (msg: string, type: 'error' | 'success') => {
    setFeedbackMsg({ text: msg, type });
    setTimeout(() => setFeedbackMsg({ text: '', type: '' }), 4000);
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    // Handle Firestore Timestamp or JS Date
    const date = timestamp.toDate ? timestamp.toDate() : timestamp; 
    const now = new Date();
    const secondsAgo = Math.round((now.getTime() - date.getTime()) / 1000);
    
    if (secondsAgo < 60) return `${Math.max(0, secondsAgo)}s ago`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    return `${Math.floor(secondsAgo / 86400)}d ago`;
  };

  const fetchPosts = async () => {
    if (isLoadingPosts || allPostsLoaded) return;
    setIsLoadingPosts(true);

    try {
      const postsRef = collection(db, COLLECTIONS.POSTS_PUBLIC);
      let q;

      if (lastVisiblePost) {
        q = query(postsRef, orderBy('timestamp', 'desc'), startAfter(lastVisiblePost), limit(POSTS_PER_PAGE));
      } else {
        q = query(postsRef, orderBy('timestamp', 'desc'), limit(POSTS_PER_PAGE));
      }

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setAllPostsLoaded(true);
      } else {
        const newPosts: PostData[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Filter hidden posts locally
          if ((data.reportCount || 0) < HIDE_THRESHOLD || data.isImmune === true) {
            newPosts.push({
              id: doc.id,
              content: data.content,
              timestamp: data.timestamp,
              reportCount: data.reportCount || 0,
              isImmune: data.isImmune
            });
          }
        });

        setPosts(prev => [...prev, ...newPosts]);
        setLastVisiblePost(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handlePostSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showFeedback("Cannot post: not connected.", "error");
      return;
    }

    const lastPostTime = localStorage.getItem(STORAGE_KEYS.LAST_POST_TIMESTAMP);
    if (lastPostTime && (Date.now() - parseInt(lastPostTime)) / 1000 < POST_COOLDOWN_SECONDS) {
      const remaining = Math.ceil(POST_COOLDOWN_SECONDS - (Date.now() - parseInt(lastPostTime)) / 1000);
      showFeedback(`Please wait ${remaining}s to post again.`, 'error');
      return;
    }

    const contentToSubmit = postContent.trim();
    if (!contentToSubmit) {
      showFeedback("You can't share an empty thought!", 'error');
      return;
    }

    setShareBtnDisabled(true);
    setShareBtnText("Sharing...");

    try {
      const batch = writeBatch(db);
      const newPrivatePostRef = doc(collection(db, COLLECTIONS.POSTS_PRIVATE));
      const newPublicPostRef = doc(collection(db, COLLECTIONS.POSTS_PUBLIC), newPrivatePostRef.id);

      const privatePostData = { content: contentToSubmit, timestamp: serverTimestamp(), reportCount: 0, authorId: currentUser.uid, isImmune: false };
      const publicPostData = { content: contentToSubmit, timestamp: serverTimestamp(), reportCount: 0, isImmune: false };

      batch.set(newPrivatePostRef, privatePostData);
      batch.set(newPublicPostRef, publicPostData);

      const userActivityRef = doc(db, COLLECTIONS.USER_ACTIVITY, currentUser.uid);
      batch.set(userActivityRef, { lastPostTimestamp: serverTimestamp(), authorId: currentUser.uid });

      await batch.commit();

      // Update Local Storage
      const newMyPostIds = [...myPostIds, newPrivatePostRef.id];
      setMyPostIds(newMyPostIds);
      localStorage.setItem(STORAGE_KEYS.MY_POST_IDS, JSON.stringify(newMyPostIds));
      localStorage.setItem(STORAGE_KEYS.LAST_POST_TIMESTAMP, Date.now().toString());

      showFeedback('Your post was shared!', 'success');
      setPostContent('');
      
      // Optimistic Update
      const newPostObj: PostData = {
        id: newPrivatePostRef.id,
        content: contentToSubmit,
        timestamp: new Date() as any, // Cast for optimistic UI
        reportCount: 0,
        isImmune: false
      };
      setPosts(prev => [newPostObj, ...prev]);

    } catch (error) {
      console.error("Error adding post: ", error);
      showFeedback("Error sharing post. You may be blocked or posting too frequently.", 'error');
    } finally {
      setShareBtnDisabled(false);
      setShareBtnText("Share Anonymously");
    }
  };

  const handleReport = async (postId: string) => {
    if (!currentUser) return;
    
    // Optimistic UI update for button
    setReportedPosts(prev => {
       const updated = [...prev, postId];
       localStorage.setItem(STORAGE_KEYS.REPORTED_POSTS, JSON.stringify(updated));
       return updated;
    });

    try {
      await runTransaction(db, async (transaction) => {
        const postRef = doc(db, COLLECTIONS.POSTS_PUBLIC, postId);
        const reportReceiptRef = doc(db, COLLECTIONS.POSTS_PUBLIC, postId, 'reporters', currentUser.uid);

        const receiptDoc = await transaction.get(reportReceiptRef);
        if (receiptDoc.exists()) throw new Error("Already reported");

        const postDoc = await transaction.get(postRef);
        if (!postDoc.exists()) throw new Error("Post does not exist.");

        const newCount = (postDoc.data().reportCount || 0) + 1;
        transaction.set(reportReceiptRef, { reporterId: currentUser.uid, timestamp: serverTimestamp() });
        transaction.update(postRef, { reportCount: newCount });
      });

      // Hide post locally if threshold reached
      setPosts(prev => prev.map(p => {
         if (p.id === postId) {
             const newCount = p.reportCount + 1;
             // We don't remove it from array immediately to avoid jumpy UI, 
             // but logic could be added here if desired.
             return { ...p, reportCount: newCount };
         }
         return p;
      }));

    } catch (error: any) {
      console.error("Report transaction failed: ", error.message);
    }
  };

  const handleFeedbackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setModalStatus({ text: "Cannot submit: not connected.", type: "error" });
      return;
    }

    if (feedbackText.trim().length < 10) {
      setModalStatus({ text: "Please provide more detail.", type: "error" });
      return;
    }

    const cooldownKey = feedbackType === 'bug' ? STORAGE_KEYS.LAST_BUG_TIMESTAMP : STORAGE_KEYS.LAST_FEATURE_TIMESTAMP;
    const lastSubmitTime = localStorage.getItem(cooldownKey);
    if (lastSubmitTime && (Date.now() - parseInt(lastSubmitTime)) / 1000 < FEEDBACK_COOLDOWN_SECONDS) {
       const remaining = Math.ceil(FEEDBACK_COOLDOWN_SECONDS - (Date.now() - parseInt(lastSubmitTime)) / 1000);
       setModalStatus({ text: `Please wait ${remaining}s to submit again.`, type: "error" });
       return;
    }

    setIsSubmittingFeedback(true);
    setModalStatus({ text: '', type: '' });

    try {
      const batch = writeBatch(db);
      const collectionName = feedbackType === 'bug' ? COLLECTIONS.BUG_REPORTS : COLLECTIONS.FEATURE_SUGGESTIONS;
      const newRef = doc(collection(db, collectionName));
      
      batch.set(newRef, {
        message: feedbackText.trim(),
        timestamp: serverTimestamp(),
        userAgent: navigator.userAgent,
        authorId: currentUser.uid
      });

      const userActivityRef = doc(db, COLLECTIONS.USER_ACTIVITY, currentUser.uid);
      const timestampField = feedbackType === 'bug' ? 'lastBugReportTimestamp' : 'lastFeatureSuggestionTimestamp';
      batch.set(userActivityRef, { [timestampField]: serverTimestamp() }, { merge: true });

      await batch.commit();
      
      localStorage.setItem(cooldownKey, Date.now().toString());
      setModalStatus({ text: "Thank you! Feedback submitted.", type: "success" });
      setTimeout(() => {
        setIsModalOpen(false);
        setFeedbackText('');
        setModalStatus({ text: '', type: '' });
      }, 2000);

    } catch (error) {
      console.error(error);
      setModalStatus({ text: "Could not submit feedback.", type: "error" });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // --- Render Helpers ---
  // Filter logic for "My Posts" and Hiding Reported posts
  const displayedPosts = posts.filter(post => {
      // 1. Hide if reported too much (unless immune)
      if (post.reportCount >= HIDE_THRESHOLD && !post.isImmune) return false;
      // 2. Hide if "My Posts" mode is on and this isn't mine
      // Note: We use the CSS class on body for hiding generally to match original logic,
      // but for React rendering we add a specific class to the card.
      return true; 
  });
  
  const hasMyPosts = posts.some(p => myPostIds.includes(p.id));

  return (
    <>
      <button 
        id="theme-toggle-button" 
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <header>
        <div className="header-content">
          <h1>HearMeOuttt</h1>
          <nav className="header-nav">
            <button 
              onClick={() => setIsMyPostsMode(!isMyPostsMode)}
              className={`nav-button ${isMyPostsMode ? 'active' : ''}`}
            >
              {isMyPostsMode ? 'All Posts' : 'My Posts'}
            </button>
            <button 
              className="nav-button"
              onClick={() => setIsModalOpen(true)}
            >
              Feedback & Bugs
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="submission-area">
          <form onSubmit={handlePostSubmit}>
            <label htmlFor="post-content" className="visually-hidden">Anonymous Post Content</label>
            <textarea 
              id="post-content" 
              rows={6} 
              maxLength={MAX_CHARS}
              placeholder="Compose your thoughts... (Ctrl+Enter to send)"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  if (!shareBtnDisabled) handlePostSubmit(e);
                }
              }}
            />

            <div className="form-footer">
              <span className={`feedback-message ${feedbackMsg.type}`}>
                {feedbackMsg.text}
              </span>
              <span id="char-counter">{postContent.length} / {MAX_CHARS}</span>
            </div>

            <button type="submit" id="share-button" disabled={shareBtnDisabled}>
              {shareBtnText}
            </button>
          </form>
        </section>

        <section className="feed-area">
          <div id="post-feed">
            {displayedPosts.map((post) => {
              const isMine = myPostIds.includes(post.id);
              const isReported = reportedPosts.includes(post.id);

              return (
                <div 
                  key={post.id} 
                  className={`post-card ${isMine ? 'my-post' : ''}`}
                >
                  <button 
                    className="report-button" 
                    onClick={() => handleReport(post.id)}
                    disabled={isReported}
                  >
                    {isReported ? 'Reported' : 'Report'}
                  </button>
                  <p className="post-content">{post.content}</p>
                  <span className="post-timestamp">{formatTimestamp(post.timestamp)}</span>
                </div>
              );
            })}
          </div>

          {isLoadingPosts && (
            <div className="loader-container">
              <div className="loader"></div>
            </div>
          )}

          {isMyPostsMode && !hasMyPosts && !isLoadingPosts && (
             <div className="feed-status">
               <p>You haven't posted anything from this browser yet.</p>
             </div>
          )}

          {allPostsLoaded && !isLoadingPosts && !isMyPostsMode && (
            <div className="feed-status">
              <p>You've reached the end.</p>
            </div>
          )}
        </section>
      </main>

      {/* Feedback Modal */}
      <div 
        className={`modal-overlay ${isModalOpen ? 'open' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
      >
        <div className="modal-content">
          <button 
            className="modal-close" 
            onClick={() => setIsModalOpen(false)}
          >×</button>
          <h2>Submit Feedback</h2>
          <p>Found a bug or have an idea for a new feature? Let me know!</p>
          <form id="feedback-form" onSubmit={handleFeedbackSubmit}>
            <div className="feedback-type">
              <label>
                <input 
                  type="radio" 
                  name="feedbackType" 
                  checked={feedbackType === 'bug'}
                  onChange={() => setFeedbackType('bug')}
                /> Bug Report
              </label>
              <label>
                <input 
                  type="radio" 
                  name="feedbackType" 
                  checked={feedbackType === 'feature'}
                  onChange={() => setFeedbackType('feature')}
                /> Feature Suggestion
              </label>
            </div>
            <textarea 
              rows={5} 
              placeholder="Please be as detailed as possible..."
              required
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
            <button type="submit" disabled={isSubmittingFeedback}>
              {isSubmittingFeedback ? 'Submitting...' : 'Submit'}
            </button>
            <div className={`feedback-form-status ${modalStatus.type}`}>
              {modalStatus.text}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}