
import React, { useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Send, User, Bot, Loader2, CalendarPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ChatBox() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    onToolCall({ toolCall }) {
      console.log('Tool call detected:', toolCall);
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white/50 backdrop-blur-sm border border-stone-200 rounded-2xl shadow-xl overflow-hidden">
      <header className="px-6 py-4 border-bottom border-stone-100 flex items-center justify-between bg-stone-50/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-stone-900 rounded-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-serif font-semibold text-stone-900">ZenCalendar</h2>
            <p className="text-xs text-stone-500 font-medium uppercase tracking-wider">Assistant Interface</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {isLoading && (
             <Badge variant="outline" className="bg-stone-100 animate-pulse text-stone-600 border-stone-200">
               Assistant is thinking...
             </Badge>
           )}
        </div>
      </header>

      <ScrollArea ref={scrollRef} className="flex-1 px-6 py-8">
        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 space-y-4"
              >
                <div className="mx-auto w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                  <CalendarPlus className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="font-serif text-xl text-stone-800">Welcome to ZenCalendar</h3>
                <p className="text-stone-500 max-w-sm mx-auto">
                  I can help you manage your Google Calendar events. Try asking to "list my events for today" or "schedule a meeting with Sarah for tomorrow at 2 PM".
                </p>
              </motion.div>
            )}

            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex gap-4",
                  m.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className={cn(
                  "w-8 h-8",
                  m.role === 'user' ? "order-2" : "order-1"
                )}>
                  {m.role === 'user' ? (
                    <AvatarFallback className="bg-stone-100 text-stone-600">
                      <User size={16} />
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-stone-900 text-white">
                      <Bot size={16} />
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className={cn(
                  "max-w-[80%] space-y-2",
                  m.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                    m.role === 'user'
                      ? "bg-stone-900 text-white rounded-tr-none"
                      : "bg-stone-100 text-stone-800 rounded-tl-none border border-stone-200"
                  )}>
                    {m.content}
                  </div>
                  {m.toolInvocations?.map((tool) => (
                    <div key={tool.toolCallId} className="mt-2">
                       <Badge variant="secondary" className="bg-stone-200 text-stone-700 hover:bg-stone-200">
                         {tool.toolName === 'list_events' && 'Fetching events...'}
                         {tool.toolName === 'create_event' && 'Creating event...'}
                         {tool.toolName === 'update_event' && 'Updating event...'}
                         {tool.toolName === 'delete_event' && 'Removing event...'}
                       </Badge>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      <div className="p-6 bg-stone-50/50 border-t border-stone-100">
        <form onSubmit={handleSubmit} className="relative flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your request here..."
            className="flex-1 bg-white border-stone-200 py-6 rounded-xl focus-visible:ring-stone-400 focus-visible:border-stone-400"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-auto px-6 bg-stone-900 hover:bg-stone-800 text-white rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
        <p className="mt-3 text-[10px] text-center text-stone-400 font-medium uppercase tracking-widest">
          Secure AI-Powered Scheduling
        </p>
      </div>
    </div>
  );
}
