const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/datasets', require('./routes/datasets'));

app.get('/', (req, res) => {
    res.send('Backend Server is Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
