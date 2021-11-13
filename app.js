require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const multer = require("multer");

const User = require("./model/user");
const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(cors());
app.use("/uploads", express.static("uploads")); //nazwy musza byc takie jak folderu bo chodzi o path

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

app.post("/register", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    if (!(email && password && first_name && last_name)) {
      res.status(400).send("All input is required");
    }

    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }

    encryptedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password: encryptedPassword,
    });
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );
    user.token = token;
    res.status(201).json(user);
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
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
      res.status(200).json(user);
    } else {
      res.status(409).send("Invalid Credentials");
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/getUser", async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findOne({ id });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
  }
});

app.post("/addTask", async (req, res) => {
  try {
    const { id, task } = req.body;
    const user = await User.findOne({ id });
    user.tasks = [...user.tasks, task];
    await user.save();
    res.status(200).json(task);
  } catch (err) {
    console.log(err);
  }
});

app.get("/getTasks", async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findOne({ id });
    res.status(200).json(user.tasks);
  } catch (err) {
    console.log(err);
  }
});

app.patch("/getTasks/:taskId", async (req, res) => {
  try {
    const user = req.body;
    const taskId = req.params.taskId;
    const taskToChange = user.tasks.find((task) => {
      return task.id === parseInt(taskId);
    });
    const newUser = await User.findOneAndUpdate(
      {
        _id: user._id,
      },
      {
        $set: {
          "tasks.$[element].done": !taskToChange.done,
        },
      },
      { arrayFilters: [{ "element.id": taskId }] }
    );
    newUser.save();

    res.status(200).json(taskToChange);
  } catch (err) {
    console.log(err);
  }
});

app.delete("/removeTask/:userId/:taskId", async (req, res) => {
  try {
    const { taskId, userId } = req.params;
    const newUser = await User.findOneAndUpdate(
      {
        _id: userId,
      },
      {
        $pull: {
          tasks: { id: taskId },
        },
      }
    );
    newUser.save();
    res.status(200).json(taskId);
  } catch (err) {
    console.log(err);
  }
});
app.patch("/user/:userId/avatar", uploadFile, async (req, res) => {
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
    console.log(avatarUrl);
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
module.exports = app;
