'use client';

import React, { useEffect, useState, useRef, FormEvent } from 'react';
import Link from 'next/link';
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
  getDoc,
  limit,
  startAfter,
  writeBatch,
  runTransaction,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
  where
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
  const [showNotice, setShowNotice] = useState(false);
  const [showDeletionTip, setShowDeletionTip] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature'>('bug');
  const [feedbackText, setFeedbackText] = useState('');
  const [modalStatus, setModalStatus] = useState<{ text: string; type: string }>({ text: '', type: '' });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Share & Toast State
  const [activeSharePostId, setActiveSharePostId] = useState<string | null>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const hasHandledSharedPostRef = useRef(false);

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

    const noticeDismissed = localStorage.getItem('noticeDismissed');
    if (noticeDismissed !== 'true') {
      setShowNotice(true);
    }

    const tipDismissed = localStorage.getItem('deletionTipDismissed');
    if (tipDismissed === 'true') {
      setShowDeletionTip(false);
    }

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

  // 4. Handle Shared Post Highlighting
  useEffect(() => {
    if (hasHandledSharedPostRef.current) return;

    const handleSharedPost = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const highlightId = urlParams.get('post');
      if (!highlightId) {
        hasHandledSharedPostRef.current = true;
        return;
      }

      hasHandledSharedPostRef.current = true;
      setHighlightedPostId(highlightId);

      // Check if it's already in the posts array
      const existsLocally = posts.some(p => p.id === highlightId);

      if (!existsLocally) {
        try {
          const postDocRef = doc(db, COLLECTIONS.POSTS_PUBLIC, highlightId);
          const postDoc = await getDoc(postDocRef);
          if (postDoc.exists()) {
            const data = postDoc.data();
            const fetchedPost: PostData = {
              id: postDoc.id,
              content: data.content,
              timestamp: data.timestamp,
              reportCount: data.reportCount || 0,
              isImmune: data.isImmune
            };
            // Prepend it so it shows up at the top
            setPosts(prev => {
              if (prev.some(p => p.id === fetchedPost.id)) return prev;
              return [fetchedPost, ...prev];
            });
          }
        } catch (err) {
          console.error("Error fetching shared post:", err);
        }
      }

      // Wait a bit for the element to render in DOM
      setTimeout(() => {
        const element = document.getElementById(`post-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlighted-flash');
        }
      }, 500);
    };

    if (posts.length > 0) {
      handleSharedPost();
    }
  }, [posts]);

  // 5. Close share dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeSharePostId) {
        const dropdown = document.getElementById(`share-dropdown-${activeSharePostId}`);
        const btn = document.getElementById(`share-btn-${activeSharePostId}`);
        if (
          dropdown && !dropdown.contains(event.target as Node) &&
          btn && !btn.contains(event.target as Node)
        ) {
          setActiveSharePostId(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeSharePostId]);


  // --- Logic Functions ---

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleShareClick = (post: PostData, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeSharePostId === post.id) {
      setActiveSharePostId(null);
    } else {
      setActiveSharePostId(post.id);
    }
  };

  const handleNativeShare = async (post: PostData, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/?post=${post.id}`;
    const shareText = `Check out this anonymous post on HearMeOuttt:`;

    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await navigator.share({
          title: 'HearMeOuttt Post',
          text: `${shareText}\n\n"${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}"\n`,
          url: shareUrl,
        });
        setActiveSharePostId(null);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.error('Error sharing natively:', err);
      }
    }
  };

  const handleCopyLink = async (postId: string) => {
    const shareUrl = `${window.location.origin}/?post=${postId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!');
      setActiveSharePostId(null);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showToast('Failed to copy link.');
    }
  };

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

      // We use 'in' to check for < 5 so we can maintain strict chronological sorting.
      const safeReportCounts = [0, 1, 2, 3, 4];

      let qSafe;
      let qImmune;

      if (lastVisiblePost) {
        qSafe = query(
          postsRef,
          where('reportCount', 'in', safeReportCounts),
          orderBy('timestamp', 'desc'),
          startAfter(lastVisiblePost),
          limit(POSTS_PER_PAGE)
        );
        qImmune = query(
          postsRef,
          where('isImmune', '==', true),
          orderBy('timestamp', 'desc'),
          startAfter(lastVisiblePost),
          limit(POSTS_PER_PAGE)
        );
      } else {
        qSafe = query(postsRef, where('reportCount', 'in', safeReportCounts), orderBy('timestamp', 'desc'), limit(POSTS_PER_PAGE));
        qImmune = query(postsRef, where('isImmune', '==', true), orderBy('timestamp', 'desc'), limit(POSTS_PER_PAGE));
      }

      // Execute both queries concurrently
      const [safeSnap, immuneSnap] = await Promise.all([getDocs(qSafe), getDocs(qImmune)]);

      if (safeSnap.empty && immuneSnap.empty) {
        setAllPostsLoaded(true);
      } else {
        // Merge and deduplicate using a Map
        const mergedMap = new Map<string, { post: PostData, snap: QueryDocumentSnapshot<DocumentData> }>();

        const processSnap = (doc: QueryDocumentSnapshot<DocumentData>) => {
          if (!mergedMap.has(doc.id)) {
            const data = doc.data();
            mergedMap.set(doc.id, {
              post: {
                id: doc.id,
                content: data.content,
                timestamp: data.timestamp,
                reportCount: data.reportCount || 0,
                isImmune: data.isImmune
              },
              snap: doc // Save the raw snapshot for future pagination
            });
          }
        };

        safeSnap.forEach(processSnap);
        immuneSnap.forEach(processSnap);

        // Convert the merged map to an array and sort chronologically (newest first)
        const mergedArray = Array.from(mergedMap.values()).sort((a, b) => {
          const timeA = a.post.timestamp?.seconds || 0;
          const timeB = b.post.timestamp?.seconds || 0;
          return timeB - timeA;
        });

        // Limit the array back to POSTS_PER_PAGE so pagination doesn't jump wildly
        const topResults = mergedArray.slice(0, POSTS_PER_PAGE);

        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = topResults.map(r => r.post).filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });

        // Update the cursor to the actual last item shown on the screen
        setLastVisiblePost(topResults[topResults.length - 1].snap);

        // If both queries exhausted their limits, we're likely at the end of the feed
        if (safeSnap.docs.length < POSTS_PER_PAGE && immuneSnap.docs.length < POSTS_PER_PAGE) {
          setAllPostsLoaded(true);
        }
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

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;

    if (!window.confirm("Delete this post? This action is permanent and cannot be undone.")) {
      return;
    }

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/delete-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ postId }),
      });

      const data = await res.json();

      if (data.success) {
        // Remove from posts state
        setPosts(prev => prev.filter(p => p.id !== postId));

        // Remove from localStorage and myPostIds state
        const updatedMyPosts = myPostIds.filter(id => id !== postId);
        setMyPostIds(updatedMyPosts);
        localStorage.setItem(STORAGE_KEYS.MY_POST_IDS, JSON.stringify(updatedMyPosts));

        showFeedback('Post permanently deleted.', 'success');
      } else {
        showFeedback(data.error || 'Failed to delete post.', 'error');
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      showFeedback('An error occurred while deleting the post.', 'error');
    }
  };

  const handleDismissNotice = () => {
    setShowNotice(false);
    localStorage.setItem('noticeDismissed', 'true');
  };

  const handleDismissDeletionTip = () => {
    setShowDeletionTip(false);
    localStorage.setItem('deletionTipDismissed', 'true');
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
            {/* Desktop Ko-fi Button: Sits perfectly inline right next to Bugs button */}
            <a
              href="https://ko-fi.com/harshvdev"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-button kofi-desktop-btn"
            >
              ☕ Support Me
            </a>
          </nav>
        </div>
      </header>

      <main>
        {showNotice && (
          <div className="site-notice-bar">
            <span className="site-notice-text">
              Posts are 100% anonymous. No account needed. By posting, you agree to our <Link href="/terms">Terms of Service</Link>.
            </span>
            <button
              className="site-notice-close"
              onClick={handleDismissNotice}
              aria-label="Dismiss notice"
            >
              ✕
            </button>
          </div>
        )}

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

          {/* Static deletion warning inside the form card */}
          {showDeletionTip && (
            <div className="deletion-tip">
              <span className="deletion-tip-text">
                ⚠️ <strong>Important:</strong> You can only delete your post from this browser. Clearing your browser data will permanently remove the delete option. Use the 'My Posts' button after posting to manage your posts.
              </span>
              <button
                type="button"
                className="deletion-tip-close"
                onClick={handleDismissDeletionTip}
                aria-label="Dismiss tip"
              >
                ✕
              </button>
            </div>
          )}
        </section>

        {/* Mobile Ko-fi Button: Small, clean, and perfectly centered */}
        <div className="kofi-mobile-container">
          <a
            href="https://ko-fi.com/harshvdev"
            target="_blank"
            rel="noopener noreferrer"
            className="kofi-mobile-btn"
          >
            ☕ Support the creator
          </a>
        </div>

        {/* NEW PLACEMENT: Links sit above the infinite feed so they are actually reachable */}
        <div className="feed-meta-links">
          <span>© 2026 HearMeOuttt — Must be 18+ to use</span>
          <div className="feed-links">
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <a href="mailto:project.hearmeouttt@gmail.com">Contact</a>
          </div>
        </div>

        <section className="feed-area">
          <div id="post-feed">
            {displayedPosts.map((post) => {
              const isMine = myPostIds.includes(post.id);
              const isReported = reportedPosts.includes(post.id);
              const isHighlighted = highlightedPostId === post.id;
              const isShareOpen = activeSharePostId === post.id;
              const postShareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?post=${post.id}` : '';
              const shareText = `Check out this anonymous post on HearMeOuttt:`;

              return (
                <div
                  key={post.id}
                  id={`post-${post.id}`}
                  className={`post-card ${isMine ? 'my-post' : ''} ${isHighlighted ? 'highlighted-flash' : ''}`}
                >
                  {isMine && isMyPostsMode ? (
                    <button
                      className="report-button"
                      style={{ color: '#d93025' }} // Red text for delete
                      onClick={() => handleDeletePost(post.id)}
                    >
                      Delete my post
                    </button>
                  ) : (
                    <button
                      className="report-button"
                      onClick={() => handleReport(post.id)}
                      disabled={isReported}
                    >
                      {isReported ? 'Reported' : 'Report'}
                    </button>
                  )}

                  <p className="post-content">{post.content}</p>

                  <div className="post-footer">
                    <span className="post-timestamp">{formatTimestamp(post.timestamp)}</span>
                    <div className="post-footer-actions">
                      <div className="share-container">
                        <button
                          id={`share-btn-${post.id}`}
                          className="share-btn"
                          onClick={(e) => handleShareClick(post, e)}
                          aria-expanded={isShareOpen}
                          aria-label="Share post"
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                          </svg>
                          Share
                        </button>

                        {isShareOpen && (
                          <div id={`share-dropdown-${post.id}`} className="share-dropdown">
                            <a
                              className="share-option"
                              href="#"
                              onClick={(e) => { e.preventDefault(); handleCopyLink(post.id); }}
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                              </svg>
                              Copy Link
                            </a>
                            <a
                              className="share-option"
                              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postShareUrl)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setActiveSharePostId(null)}
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                              </svg>
                              Share to X
                            </a>
                            <a
                              className="share-option"
                              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postShareUrl)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setActiveSharePostId(null)}
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                              </svg>
                              Facebook
                            </a>
                            <a
                              className="share-option"
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + postShareUrl)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setActiveSharePostId(null)}
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.424 2.5 1.134 3.471L6.5 20.5l5.244-1.375c.912.498 1.957.781 3.078.781 3.182 0 5.767-2.586 5.768-5.766.001-3.18-2.585-5.767-5.767-5.768zm3.991 8.243c-.22.617-1.285 1.138-1.782 1.17-.448.029-.861.18-2.839-.597-2.529-.99-4.13-3.561-4.256-3.73-.127-.168-.962-1.277-.962-2.435 0-1.159.605-1.73.821-1.961.216-.231.47-.289.627-.289.157 0 .313.003.449.009.143.006.335-.054.524.404.195.474.667 1.62.726 1.737.059.118.098.254.019.41-.078.157-.118.254-.236.39-.118.136-.25.304-.356.408-.12.118-.245.247-.107.485.137.236.611.996 1.309 1.617.9.8 1.658 1.047 1.893 1.166.236.119.373.099.51-.059.137-.156.587-.683.744-.917.157-.234.313-.195.528-.117.216.078 1.369.645 1.604.762.235.118.391.176.449.273.059.098.059.566-.161 1.183z" />
                              </svg>
                              WhatsApp
                            </a>
                            <a
                              className="share-option"
                              href={`https://www.reddit.com/submit?url=${encodeURIComponent(postShareUrl)}&title=${encodeURIComponent(shareText)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setActiveSharePostId(null)}
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.29-1.72l1.3-4.09 4.22.89c.02.94.8 1.7 1.75 1.7 1.02 0 1.84-.83 1.84-1.85 0-1.02-.83-1.85-1.85-1.85-.75 0-1.4.45-1.69 1.1l-4.73-1c-.22-.05-.46.07-.52.29l-1.5 4.74C8.9 7.02 6.64 7.66 4.96 8.67c-.55-.74-1.43-1.17-2.38-1.17-1.65 0-3 1.35-3 3 0 1.1.6 2.06 1.48 2.58-.05.28-.08.57-.08.87 0 3.7 4.87 6.72 10.88 6.72 6.01 0 10.88-3.02 10.88-6.72 0-.3-.03-.59-.08-.87.88-.52 1.48-1.48 1.48-2.58zm-18.4 1c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8-.8 1.8-1.8 1.8-1.8-.8-1.8-1.8zm11.3 4.2c-.88.88-2.54.94-2.9.94-.36 0-2.02-.06-2.9-.94-.19-.19-.19-.51 0-.7.19-.19.51-.19.7 0 .53.53 1.63.63 2.2.63.57 0 1.67-.1 2.2-.63.19-.19.51-.19.7 0 .2.19.2.51 0 .7zm-1-2.4c-.99 0-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8 1.8.8 1.8 1.8-.8 1.8-1.8 1.8z" />
                              </svg>
                              Reddit
                            </a>
                            {typeof navigator !== 'undefined' && !!(navigator as any).share && (
                              <button className="share-option" onClick={(e) => handleNativeShare(post, e)}>
                                <svg viewBox="0 0 24 24">
                                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                                </svg>
                                More Options...
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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

      {toastMsg && (
        <div className="toast-notification">
          <span>{toastMsg}</span>
        </div>
      )}
    </>
  );
}