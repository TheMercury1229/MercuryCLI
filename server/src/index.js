import express from "express";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
// Dont move it else the auth routes will not work for better-auth
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.get("/device", (req, res) => {
  // const { user_code } = req.query;
  res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/device`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
