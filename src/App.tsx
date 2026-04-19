
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { ChatBox } from './components/ChatBox';
import { GoogleProvider } from './components/GoogleLoginProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, CheckCircle2, Lock, Sparkles, LogOut, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch (err) {
      console.error('Auth check failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });
        if (res.ok) {
          setIsAuthenticated(true);
          toast.success('Connected to Google Calendar successfully');
        }
      } catch (err) {
        toast.error('Failed to link Google account');
      }
    },
    scope: 'https://www.googleapis.com/auth/calendar',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Calendar className="w-12 h-12 text-stone-300 animate-pulse" />
          <p className="text-stone-400 font-serif">Checking connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans selection:bg-stone-200">
      <Toaster position="top-center" />

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen p-4"
          >
            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-stone-200/50 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-stone-100 rounded-full blur-[80px]" />
            </div>

            <Card className="w-full max-w-md p-8 md:p-12 space-y-8 bg-white/70 backdrop-blur-md border-stone-200/50 shadow-2xl rounded-3xl">
              <div className="space-y-3 text-center">
                <div className="inline-flex p-3 bg-stone-900 rounded-2xl mb-2">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-serif font-bold text-stone-900 tracking-tight">ZenCalendar</h1>
                <p className="text-stone-500 max-w-xs mx-auto">
                  Experience a more peaceful way to manage your time.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: <Sparkles className="w-4 h-4" />, text: "AI-Powered Scheduling" },
                  { icon: <Lock className="w-4 h-4" />, text: "Secure Sync with Google" },
                  { icon: <CheckCircle2 className="w-4 h-4" />, text: "Conflict Management" }
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-stone-600">
                    <div className="p-1 bg-stone-100 rounded-full text-stone-400">
                      {feature.icon}
                    </div>
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => login()}
                className="w-full h-14 text-lg font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-stone-200"
              >
                Connect Google Calendar
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <p className="text-[10px] text-center text-stone-400 uppercase tracking-widest font-bold">
                OAuth 2.0 Protected
              </p>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-screen"
          >
            <nav className="h-16 border-b border-stone-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
               <div className="flex items-center gap-2">
                 <Calendar className="w-5 h-5 text-stone-900" />
                 <span className="font-serif font-bold text-lg text-stone-900">ZenCalendar</span>
               </div>
               <Button
                 variant="ghost"
                 size="sm"
                 className="text-stone-500 hover:text-stone-900 transition-colors"
                 onClick={() => setIsAuthenticated(false)}
               >
                 <LogOut className="w-4 h-4 mr-2" />
                 Disconnect
               </Button>
            </nav>

            <main className="flex-1 p-4 md:p-10 bg-stone-50 overflow-hidden">
               <ChatBox />
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <GoogleProvider>
      <Dashboard />
    </GoogleProvider>
  );
}
