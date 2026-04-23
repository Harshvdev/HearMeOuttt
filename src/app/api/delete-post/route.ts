import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Safely format the key regardless of local Next.js or Vercel parsing
function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY || '';
  // 1. Strip any surrounding quotes that might have been left behind
  const unquoted = key.replace(/^"|"$/g, '');
  // 2. Convert literal "\n" strings into actual newlines (required for Vercel)
  return unquoted.replace(/\\n/g, '\n');
}

// Initialize Firebase Admin safely in Next.js
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    }),
  });
}

const db = admin.firestore();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, uid } = body;

    if (!postId || !uid) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Verify the post exists in the private collection
    const privatePostRef = db.collection('posts').doc(postId);
    const privatePostSnap = await privatePostRef.get();

    if (!privatePostSnap.exists) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    const postData = privatePostSnap.data();

    // 2. Verify ownership (CRITICAL SECURITY STEP)
    if (postData?.authorId !== uid) {
      return NextResponse.json({ success: false, error: 'Unauthorized: You can only delete your own posts' }, { status: 403 });
    }

    // 3. Batch delete from both collections
    const batch = db.batch();
    const publicPostRef = db.collection('posts_public').doc(postId);

    batch.delete(privatePostRef);
    batch.delete(publicPostRef);

    await batch.commit();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('API Error (delete-post):', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}