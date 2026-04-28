import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import webpush from "web-push";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// Configure Web Push
if (process.env.VITE_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  let subject = process.env.VAPID_SUBJECT || "mailto:example@yourdomain.com";
  if (!subject.startsWith("mailto:") && !subject.startsWith("https://")) {
    subject = "mailto:" + subject;
  }
  
  try {
    webpush.setVapidDetails(
      subject,
      process.env.VITE_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } catch (error: any) {
    console.warn("Web Push disabled: Invalid VAPID keys provided in environment.");
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "Aether OS Core: Online" });
  });

  // Fetch leaderboard data from Supabase Auth Users
  app.get("/api/leaderboard", async (req, res) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Missing Supabase URL or Service Role Key in environment." });
    }

    try {
      const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      const { data, error } = await adminClient.auth.admin.listUsers();
      if (error) throw error;
      
      const players = data.users.map((u, i) => {
         // Mock stats based on index/id for now if not present, but use real handles
         const handle = u.user_metadata?.username || u.email?.split('@')[0] || `UNKNOWN_${i}`;
         const role = u.user_metadata?.role || 'member';
         const isVerified = u.user_metadata?.is_verified ?? false;
         
         // Using string length or just consistent random values since we don't have real app stats yet
         const consistency = Math.max(50, 99 - (i * 2));
         const volume = (Math.max(10, 100 - i) * 100).toLocaleString();
         
         return {
           id: u.id,
           handle: handle.startsWith('@') ? handle : `@${handle.toUpperCase()}`,
           consistency,
           volume,
           verified: role === 'owner' ? isVerified : true, // pilots verified by default
           role
         };
      });

      res.json({ leaderboard: players });
    } catch (error: any) {
      console.error("Leaderboard fetch error:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard." });
    }
  });

  // Save push subscription
  app.post("/api/notifications/subscribe", (req, res) => {
    const subscription = req.body;
    // In a real app, save to Firestore. For now, acknowledge.
    console.log("New Subscription:", subscription);
    res.status(201).json({ status: "subscribed" });
  });

  // Trigger test alarm
  app.post("/api/notifications/test-alarm", async (req, res) => {
    const { subscription } = req.body;
    const payload = JSON.stringify({
      title: "Sync-Alarm: Aether OS",
      body: "High-priority task starting in 5 minutes.",
      icon: "/icon.png",
      data: { url: "/" }
    });

    try {
      await webpush.sendNotification(subscription, payload);
      res.status(200).json({ status: "sent" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "failed to send" });
    }
  });

 // Route mapping handled on client side

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Aether OS running on http://localhost:${PORT}`);
  });
}

startServer();
