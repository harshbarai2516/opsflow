"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.get("/api/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Developer Profile API is running",
        timestamp: new Date().toISOString(),
    });
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map