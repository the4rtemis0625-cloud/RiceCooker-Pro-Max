"use client";

import { useEffect, useState } from "react";
import { FirebaseProvider } from "./provider";

// This component ensures that its children are only rendered on the client side.
// This is crucial for libraries like Firebase that are not SSR-compatible.
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect will only run on the client, after the initial server render.
    setIsClient(true);
  }, []);

  // While `isClient` is false, we are on the server or in the initial client render phase.
  // We return null to avoid rendering children that might depend on client-only APIs.
  if (!isClient) {
    return null; 
  }

  return <FirebaseProvider>{children}</FirebaseProvider>;
}
