
const { Server } = require("socket.io");

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("job:subscribe", (jobId) => {
      // Validate IDs before using them as room names.
      if (
        typeof jobId !== "string" ||
        !/^[a-zA-Z0-9_-]{1,100}$/.test(jobId)
      ) {
        return;
      }

      // Demo only: production must authorize this user's job access.
      socket.join(`job:${jobId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

function emitJobProgress(jobId, progress) {
  if (!io) return;

  io.to(`job:${jobId}`).emit("etl:progress", {
    jobId,
    ...progress,
    updatedAt: new Date().toISOString()
  });
}

function emitJobStatus(jobId, status, message) {
  if (!io) return;

  io.to(`job:${jobId}`).emit("etl:status", {
    jobId,
    status,
    message,
    updatedAt: new Date().toISOString()
  });
}

module.exports = {
  initializeSocket,
  emitJobProgress,
  emitJobStatus
};
