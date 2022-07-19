import express from "express";
export const router = express.Router();

import User from "../model/user.js";
router.post("/addTask", async (req, res) => {
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

router.get("/getTasks", async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findOne({ id });
    res.status(200).json(user.tasks);
  } catch (err) {
    console.log(err);
  }
});

router.patch("/getTasks/:taskId", async (req, res) => {
  try {
    const user = req.body;
    const taskId = req.params.taskId;
    const taskToChange = user.tasks.find((task) => {
      return task.id === parseInt(taskId);
    });
    console.log(user.tasks);
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

router.delete("/removeTask/:userId/:taskId", async (req, res) => {
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
