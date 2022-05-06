import mongoose from "mongoose";
const drugSchema = new mongoose.Schema({});
const userSchema = new mongoose.Schema({
  first_name: { type: String, default: null },
  last_name: { type: String, default: null },
  login: { type: String, default: null },
  email: { type: String, unique: true },
  password: { type: String },
  avatar: { type: String },
  drugs: [
    {
      drug_name: { type: String },
      frequency: { type: Number },
      amount: { type: Number },
      when: { type: Number },
      additionalInfo: { type: String },
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

export default mongoose.model("users", userSchema);
