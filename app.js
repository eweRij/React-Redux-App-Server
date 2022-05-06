import dotenv from "dotenv";
dotenv.config();

import { connect } from "./config/database.js";
connect(); //łączy z bazą --> plik w folderze config!

import express from "express";

import cors from "cors";
import cookieParser from "cookie-parser";

import { router as user } from "./routes/user.js";
import { router as drugs } from "./routes/drugs.js";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use("/uploads", express.static("uploads")); //nazwy musza byc takie jak folderu bo chodzi o path,umozliwia dostep do plikow
app.use(cookieParser());

app.use("/user", user);
app.use("/drugs", drugs);
app.use("*", (req, res) => {
  res.status(404).json({
    success: "false",
    message: "Page not found",
    error: {
      statusCode: 404,
      message: "You reached a route that is not defined on this server",
    },
  });
});
export default app;
