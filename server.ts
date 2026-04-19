
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser(process.env.SESSION_SECRET || 'zen-calendar-secret'));

  const opencode = createOpenAI({
    baseURL: 'https://opencode.ai/zen/v1',
    apiKey: process.env.OPENCODE_API_KEY,
  });

  // Google Calendar Helper
  const getAuthClient = (accessToken: string) => {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });
    return google.calendar({ version: 'v3', auth: oauth2Client });
  };

  // API for testing connection
  app.get('/api/auth/status', (req, res) => {
    const token = req.signedCookies.google_token;
    res.json({ authenticated: !!token });
  });

  // API to set token
  app.post('/api/auth/google', (req, res) => {
    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ error: 'Missing access token' });
    }
    res.cookie('google_token', access_token, {
      httpOnly: true,
      secure: true,
      signed: true,
      sameSite: 'none',
      maxAge: 3600000 // 1 hour
    });
    res.json({ success: true });
  });

  // Chat endpoint
  app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;
    const accessToken = req.signedCookies.google_token;

    if (!accessToken) {
      return res.status(401).json({ error: 'Not authenticated with Google Calendar.' });
    }

    const calendar = getAuthClient(accessToken);

    try {
      const result = await streamText({
        model: opencode('opencode/big-pickle'),
        system: `You are a helpful, concise calendar assistant that can read and modify the user's Google Calendar.
When listing events, summarize them clearly.
When creating events, ask for missing details like title, start time, or end time if they are not provided.
The current time is ${new Date().toISOString()}.`,
        messages,
        tools: {
          list_events: tool({
            description: 'List user calendar events',
            parameters: z.object({
              timeMin: z.string().optional().describe('ISO start time'),
              timeMax: z.string().optional().describe('ISO end time'),
            }),
            execute: async ({ timeMin, timeMax }) => {
              const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: timeMin || new Date().toISOString(),
                timeMax: timeMax,
                maxResults: 10,
                singleEvents: true,
                orderBy: 'startTime',
              });
              return response.data.items || [];
            },
          }),
          create_event: tool({
            description: 'Create a new calendar event',
            parameters: z.object({
              summary: z.string().describe('Event title'),
              description: z.string().optional().describe('Event description'),
              start: z.string().describe('ISO start time'),
              end: z.string().describe('ISO end time'),
            }),
            execute: async ({ summary, description, start, end }) => {
              const response = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: {
                  summary,
                  description,
                  start: { dateTime: start },
                  end: { dateTime: end },
                },
              });
              return response.data;
            },
          }),
          update_event: tool({
            description: 'Update an existing calendar event',
            parameters: z.object({
              eventId: z.string(),
              summary: z.string().optional(),
              start: z.string().optional(),
              end: z.string().optional(),
            }),
            execute: async ({ eventId, summary, start, end }) => {
              const patch: any = {};
              if (summary) patch.summary = summary;
              if (start) patch.start = { dateTime: start };
              if (end) patch.end = { dateTime: end };

              const response = await calendar.events.patch({
                calendarId: 'primary',
                eventId,
                requestBody: patch,
              });
              return response.data;
            },
          }),
          delete_event: tool({
            description: 'Delete a calendar event',
            parameters: z.object({
              eventId: z.string(),
            }),
            execute: async ({ eventId }) => {
              await calendar.events.delete({
                calendarId: 'primary',
                eventId,
              });
              return { success: true };
            },
          }),
        },
      });

      result.pipeTextStreamToResponse(res);
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Failed to process chat request' });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
