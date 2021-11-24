import dotenv from "dotenv";
dotenv.config();
import { createTransport } from "nodemailer";
import User from "../model/user.js";

const user = process.env.USER;
const pass = process.env.PASS;

const transport = createTransport({
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: user,
    pass: pass,
  },
});

export const sendConfirmationEmail = (name, email, confirmationCode) => {
  transport
    .sendMail({
      from: user,
      to: email,
      subject: "Please confirm your account",
      html: `<h1>Email Confirmation</h1>
          <h2>Hello ${name}</h2>
          <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
          <a href=http://localhost:3000/#/confirm/${confirmationCode}> Click here</a>
          </div>`,
    })
    .catch((err) => console.log(err));
};

export const verifyUser = (req, res, next) => {
  User.findOne({
    confirmationCode: req.params.confirmationCode,
  })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      user.status = "Active";
      user.save((err) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }
      });
    })
    .catch((e) => console.log("error", e));
  next();
};
