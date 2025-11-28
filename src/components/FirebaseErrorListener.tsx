'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// This component listens for permission errors and throws them.
// This might seem strange, but it's a pattern to get errors from deep in your app
// (like a hook) to show up on the Next.js development error overlay.
export function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // We throw the error here so that Next.js can catch it and display its rich error overlay.
      // This is incredibly useful for debugging security rules during development.
      throw error;
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, []);

  return null; // This component doesn't render anything.
}
