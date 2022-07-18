import jwt from "jsonwebtoken";
//token + cookies
const config = process.env;
//middleware for token verify
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  console.log(token);
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    const decoded = jwt.verify(token, config.TOKEN_KEY);

    req.user = decoded;

    return next();
  } catch {
    return res.status(401).send("Invalid Token");
  }
};
export default verifyToken;
