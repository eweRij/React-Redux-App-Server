import express from "express";
export const router = express.Router();
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";

import User from "../model/user.js";
//do avatarów
// const directoryPath = path.join(path.resolve(), "uploads");
// let dir = [];

// fs.readdir(directoryPath, (err, files) => {
//   if (err) {
//     return console.log("Can not scan the directory: " + err);
//   }
//   files.forEach((file) => {
//     dir.push(file);
//   });
// });// to sie moze kiedys przydac :)

const maxSize = 2 * 1024 * 1024;

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).single("avatar");

router.post("/register", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    if (!(email && password && first_name && last_name)) {
      res.status(400).send("All input is required");
    }

    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }

    const encryptedPassword = await bcrypt.hash(password, 10);
    const characters =
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let confirmationCode = "";
    for (let i = 0; i < 25; i++) {
      confirmationCode +=
        characters[Math.floor(Math.random() * characters.length)];
    }
    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password: encryptedPassword,
      confirmationCode: confirmationCode,
    });
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );

    user.token = token;

    // sendConfirmationEmail(user.first_name, user.email, user.confirmationCode);

    res.status(201).json(user);
  } catch (err) {
    console.log(err);
  }
});

// user.patch("/confirm/:confirmationCode", verifyUser);

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      res.status(400).send("All input is required");
    }
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );
      user.token = token;
      user.save();

      // if (user.status != "Active") {
      //   return res.status(401).send({
      //     message: "Pending Account. Please Verify Your Email!",
      //   });
      // }
      res.status(200).json(user);
    } else {
      res.status(409).send("Invalid Credentials");
    }
  } catch (err) {
    console.log(err);
  }
});

router.get("/getUser", async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findOne({ id });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
});
router.patch("/:userId/avatar", uploadFile, async (req, res) => {
  try {
    const { userId } = req.params;
    const avatar = req.file.originalname;
    const avatarUrl = `${req.protocol}://${req.hostname}:4001/uploads/${avatar}`;
    const newUser = await User.findOneAndUpdate(
      {
        _id: userId,
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
      return res.status(500).send({
        message: "File size cannot be larger than 2MB!",
      });
    }

    res.status(500).send({
      message: `Could not upload the file: ${req.file}. ${err}`,
    });
  }
});
