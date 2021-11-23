const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  first_name: { type: String, default: null },
  last_name: { type: String, default: null },
  email: { type: String, unique: true },
  password: { type: String },
  token: { type: String },
  avatar: { type: String },
  tasks: [
    {
      id: { type: Number },
      category: { type: String },
      description: { type: String },
      importance: { type: String },
      done: { type: Boolean },
    },
  ],
  status: {
    type: String,
    enum: ["Pending", "Active"],
    default: "Pending",
  },
  confirmationCode: {
    type: String,
    unique: true,
  },
});

module.exports = mongoose.model("user", userSchema);
