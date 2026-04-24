import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import webpush from "web-push";
import dotenv from "dotenv";

dotenv.config();

// Configure Web Push
if (process.env.VITE_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:example@yourdomain.com",
    process.env.VITE_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "Aether OS Core: Online" });
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
