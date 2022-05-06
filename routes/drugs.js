import express from "express";
import User from "../model/user.js";
import verifyToken from "../middleware/auth.js";

export const router = express.Router();

router.post("/addDrug/:id", verifyToken, async (req, res) => {
  try {
    console.log(req);
    const { id } = req.params;
    const { drug } = req.body;
    console.log(id);
    console.log(drug);
    const user = await User.findOne({ id });
    user.drugs = [...user.drugs, drug];
    await user.save();
    res.status(200).json(drug);
  } catch (err) {
    console.log(err);
  }
});

// router.get("/getTasks", verifyToken, async (req, res) => {
//   try {
//     const { id } = req.body;
//     const user = await User.findOne({ id });
//     res.status(200).json(user.tasks);
//   } catch (err) {
//     console.log(err);
//   }
// });

// router.patch("/getTasks/:taskId", verifyToken, async (req, res) => {
//   try {
//     const user = req.body;
//     const taskId = req.params.taskId;
//     const taskToChange = user.tasks.find((task) => {
//       return task.id === parseInt(taskId);
//     });
//     console.log(user.tasks);
//     const newUser = await User.findOneAndUpdate(
//       {
//         _id: user._id,
//       },
//       {
//         $set: {
//           "tasks.$[element].done": !taskToChange.done,
//         },
//       },
//       { arrayFilters: [{ "element.id": taskId }] }
//     );
//     newUser.save();

//     res.status(200).json(taskToChange);
//   } catch (err) {
//     console.log(err);
//   }
// });

// router.delete("/removeTask/:userId/:taskId", verifyToken, async (req, res) => {
//   try {
//     const { taskId, userId } = req.params;
//     const newUser = await User.findOneAndUpdate(
//       {
//         _id: userId,
//       },
//       {
//         $pull: {
//           tasks: { id: taskId },
//         },
//       }
//     );
//     newUser.save();
//     res.status(200).json(taskId);
//   } catch (err) {
//     console.log(err);
//   }
// });
