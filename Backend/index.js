
const express = require("express");
const connectDB = require("./config/db");
const allRoutes = require("./routes/allRoutes");
const cors = require("cors");
require("dotenv").config();

const myServer = express();

// Read allowed origins from the .env file
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_ALT,
].filter(Boolean);

// Configure CORS
myServer.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: process.env.CORS_CREDENTIALS === "true",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

myServer.use(express.json());

connectDB();

myServer.use("/api", allRoutes);

myServer.get("/run", (req, res) => {
  res.send("Hello");
});

const port = process.env.PORT;

myServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
