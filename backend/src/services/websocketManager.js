const { WebSocketServer } = require('ws');

let wss = null;
const jobSubscriptions = new Map(); // jobId -> Set<ws>

function initWebSocketServer(server) {
    wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws) => {
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                if (data.action === 'subscribe' && data.jobId) {
                    if (!jobSubscriptions.has(data.jobId)) {
                        jobSubscriptions.set(data.jobId, new Set());
                    }
                    jobSubscriptions.get(data.jobId).add(ws);
                    ws.send(JSON.stringify({ type: 'subscribed', jobId: data.jobId }));
                } else if (data.action === 'unsubscribe' && data.jobId) {
                    if (jobSubscriptions.has(data.jobId)) {
                        jobSubscriptions.get(data.jobId).delete(ws);
                    }
                } else if (data.action === 'get_memory') {
                    const mem = process.memoryUsage();
                    ws.send(JSON.stringify({
                        type: 'memory_stats',
                        heapUsedMB: +(mem.heapUsed / 1024 / 1024).toFixed(2),
                        heapTotalMB: +(mem.heapTotal / 1024 / 1024).toFixed(2),
                        rssMB: +(mem.rss / 1024 / 1024).toFixed(2),
                        externalMB: +(mem.external / 1024 / 1024).toFixed(2),
                        timestamp: Date.now()
                    }));
                }
            } catch (err) {
                console.error('WS message error:', err);
            }
        });

        ws.on('close', () => {
            for (const [, clients] of jobSubscriptions.entries()) {
                clients.delete(ws);
            }
        });

        // Send initial connect ack
        ws.send(JSON.stringify({ type: 'connected', message: 'StreamWeaver WS Stream Active' }));
    });

    const interval = setInterval(() => {
        if (!wss) return;
        wss.clients.forEach((ws) => {
            if (!ws.isAlive) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => {
        clearInterval(interval);
    });

    return wss;
}

function broadcastJobProgress(jobId, payload) {
    const mem = process.memoryUsage();
    const message = JSON.stringify({
        type: 'job_progress',
        jobId,
        ...payload,
        heapUsedMB: +(mem.heapUsed / 1024 / 1024).toFixed(2),
        rssMB: +(mem.rss / 1024 / 1024).toFixed(2),
        timestamp: Date.now()
    });

    // Send to subscribers of this job
    if (jobSubscriptions.has(jobId)) {
        for (const client of jobSubscriptions.get(jobId)) {
            if (client.readyState === 1) { // OPEN
                client.send(message);
            }
        }
    }

    // Also broadcast to any client with global listening flag
    if (wss) {
        wss.clients.forEach((client) => {
            if (client.readyState === 1 && client.isGlobalListener) {
                client.send(message);
            }
        });
    }
}

function broadcastJobEvent(jobId, eventType, data = {}) {
    const mem = process.memoryUsage();
    const message = JSON.stringify({
        type: eventType,
        jobId,
        ...data,
        heapUsedMB: +(mem.heapUsed / 1024 / 1024).toFixed(2),
        rssMB: +(mem.rss / 1024 / 1024).toFixed(2),
        timestamp: Date.now()
    });

    if (jobSubscriptions.has(jobId)) {
        for (const client of jobSubscriptions.get(jobId)) {
            if (client.readyState === 1) {
                client.send(message);
            }
        }
    }
}

module.exports = {
    initWebSocketServer,
    broadcastJobProgress,
    broadcastJobEvent
};
