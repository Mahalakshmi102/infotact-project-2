const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initWebSocketServer } = require('./services/websocketManager');

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebSocket server on the same HTTP server
initWebSocketServer(server);

// Connect to Database
connectDB();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Use JSON body parser for normal endpoints (busboy handles multipart on /api/etl/preview directly)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/datasets', require('./routes/datasets'));
app.use('/api/etl', require('./routes/etl'));

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'StreamWeaver High-Throughput No-Code ETL Engine',
        version: '1.0.0',
        capabilities: ['Busboy Streaming', 'isolated-vm Sandbox', 'MongoDB 5000-Row BulkWrite', 'WebSocket Live Metrics', 'Memory Safety <150MB']
    });
});

server.listen(PORT, () => {
    console.log(`StreamWeaver Backend Server running on port ${PORT}`);
    console.log(`WebSocket server initialized on ws://localhost:${PORT}/ws`);
});
