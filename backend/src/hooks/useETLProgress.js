
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export function useETLProgress(jobId) {
  const [progress, setProgress] = useState(null);
  const [status, setStatus] = useState("queued");

  useEffect(() => {
    if (!jobId) return;

    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      socket.emit("job:subscribe", jobId);
    });

    socket.on("etl:progress", (data) => {
      if (data.jobId === jobId) {
        setProgress(data);
        setStatus(data.status);
      }
    });

    socket.on("etl:status", (data) => {
      if (data.jobId === jobId) {
        setStatus(data.status);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [jobId]);

  return { progress, status };
}
