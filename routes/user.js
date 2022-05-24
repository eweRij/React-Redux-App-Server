import express from "express";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import multer from "multer";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();

import { sendConfirmationEmail, verifyUser } from "../nodemailer/nodemailer.js";
import User from "../model/user.js";
import verifyToken from "../middleware/auth.js";

export const router = express.Router(); // żeby wydzielić specyficzne ścieżki
router.use(cors({ credentials: true, origin: "http://localhost:3000" }));
router.use(cookieParser());
const maxSize = 2 * 1024 * 1024;

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
}); //do ładowania avatara

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).single("avatar"); //tez

router.post("/register", async (req, res) => {
  try {
    const { first_name, last_name, login, email, password } = req.body;

    if (!(email && password && first_name && last_name)) {
      res.status(400).send("All input is required"); //sprawdza czy wszystkie pola podane, bad req
    }

    const oldUser = await User.findOne({ email }); //szuka czy juz dany user istnieje

    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login"); //conflict
    }

    const encryptedPassword = await bcrypt.hash(password, 10); //trzeba zaszyfrowac podane przez uzytkownika hasło!!
    const characters =
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let confirmationCode = ""; // do potwierdzenia maila!!-> NODEMAILER
    for (let i = 0; i < 25; i++) {
      confirmationCode +=
        characters[Math.floor(Math.random() * characters.length)]; //
    }
    const user = await User.create({
      first_name,
      last_name,
      login,
      email: email.toLowerCase(),
      password: encryptedPassword,
      confirmationCode: confirmationCode, //tworzy w bazie usera
    });

    sendConfirmationEmail(user.first_name, user.email, user.confirmationCode);

    res.status(201).json(user);
  } catch (err) {
    console.log(err);
  }
});

router.patch("/confirm/:confirmationCode", verifyUser);
//z nodemailera sprawdza czy nadany confirmation code sie zgadza czy nie z tym ze sciezki, neie mylic z routem z react dom!
// ale polaczone przez komponent welcome
//paramsy!!!

router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!(login && password)) {
      res.status(400).send("All input is required");
    }
    const user = await User.findOne({ login });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { user_id: user._id, login }, //to pozniej w verify mozna wykorzystac!!
        process.env.TOKEN_KEY,
        {
          expiresIn: 600,
        }
      );

      res.cookie("token", token, { maxAge: 600000, httpOnly: true });

      if (user.status != "Active") {
        return res.status(401).send({
          //unauthorized
          message: "Pending Account. Please Verify Your Email!",
        });
      }
      res.status(200).json(user);
    } else {
      res.status(409).send("Invalid Credentials");
    }
  } catch (err) {
    console.log(err);
  }
});

router.get("/getUser/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ id });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
});

router.patch("/:id/avatar", verifyToken, uploadFile, async (req, res) => {
  try {
    const { id } = req.params;
    const avatar = req.file.originalname;
    const avatarUrl = `${req.protocol}://${req.hostname}:4001/uploads/${avatar}`;
    const newUser = await User.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $set: {
          avatar: avatarUrl,
        },
      }
    );
    newUser.save();
    res.send(avatarUrl);
  } catch (err) {
    if (err.code == "LIMIT_FILE_SIZE") {
      return res.status(401).send({
        message: "File size cannot be larger than 2MB!",
      });
    }
    res.status(500).send({
      message: `Could not upload the file: ${req.file}. ${err}`,
    });
  }
});

router.patch("/:id/editUserNames", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name } = req.body;
    const newUser = await User.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $set: {
          first_name: first_name,
          last_name: last_name,
        },
      }
    );
    newUser.save();
    res.status(200).send(newUser);
  } catch (err) {
    console.log(err);
  }
});

router.patch("/:id/editEmail", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const newUser = await User.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $set: {
          email: email,
        },
      }
    );
    newUser.save();
    res.status(200).send(newUser);
  } catch (err) {
    console.log(err);
  }
});
