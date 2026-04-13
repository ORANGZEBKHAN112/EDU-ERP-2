import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiRoutes from "./server/routes";
import { errorHandler } from "./server/middleware";
import dotenv from "dotenv";
import { poolPromise } from "./server/config/db";
import { initializeDatabase } from "./server/config/initDb";
import { FeeSchedulerService } from "./server/services/feeEngine";
import { EventProcessorService } from "./server/services/events/EventProcessorService";

dotenv.config();

async function startServer() {
  // Ensure DB connection
  try {
    await poolPromise;
    await initializeDatabase();
    
    // Initialize Durable Event Processor
    const eventProcessor = new EventProcessorService();
    eventProcessor.start();

    // Initialize Fee Engine Scheduler
    const feeScheduler = new FeeSchedulerService();
    feeScheduler.init();
  } catch (err) {
    console.error("CRITICAL: Could not connect to database. Server will not start.");
    process.exit(1);
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.use("/api", apiRoutes);

  // Error Handling
  app.use(errorHandler);

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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
