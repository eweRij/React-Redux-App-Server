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
  console.log("nodemailer");
  transport
    .sendMail({
      from: user,
      to: email,
      subject: "Please confirm your account",
      html: `<h1>Email Confirmation</h1>
          <h2>Hello ${name}</h2>
          <p>Thank you for your registration to Drug Manager App. Please confirm your email by clicking on the following link</p>
          <a href=http://localhost:3000/confirm/${confirmationCode}> Click here</a>
          </div>`,
    })
    .catch((err) => console.log(err));
};

export const verifyUser = (req, res, next) => {
  //spr czy nadany confirmation code zgadza sie z tym ze sciezki i zmienia na status active
  console.log("sprawdzam path i usera");
  User.findOne({
    confirmationCode: req.params.confirmationCode,
  })
    .then((user) => {
      if (!user) {
        console.log("nie ma usera");
        return res.status(404).send({ message: "User Not found." });
      }

      user.status = "Active";
      console.log("status zmieniony");
      user.save((err) => {
        if (err) {
          console.log("nie udało sie zapisać ");
          res.status(500).send({ message: err });
          return;
        }
      });
    })
    .catch((e) => console.log("error ze znalezieniem confirmation code ", e));
  next();
};
