require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./utils/db");

const authRoutes =
    require("./routes/authRoutes");

const fileRoutes =
    require("./routes/fileRoutes");

const app = express();

connectDB();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.get("/health", (req, res) => {

    res.json({
        status: "ok",
        message: "StreamWeaver backend is running"
    });

});

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/files",
    fileRoutes
);

const PORT =
    process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `StreamWeaver backend running on port ${PORT}`
    );

});