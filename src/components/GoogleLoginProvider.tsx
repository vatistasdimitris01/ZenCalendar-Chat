
import { GoogleOAuthProvider } from '@react-oauth/google';
import React from 'react';

export function GoogleProvider({ children }: { children: React.ReactNode }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50 p-6 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-serif text-stone-900">Config Required</h1>
          <p className="text-stone-600">
            Please set <code className="bg-stone-200 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> in your enviroment variables to enable Google Login.
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
