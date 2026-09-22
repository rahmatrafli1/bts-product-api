import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import db from "../config/database.js";

export async function register(req, res) {
  const { username, password, password_confirmation } = req.body;

  if (!username || !password || !password_confirmation) {
    return res.status(400).json({
      error: "Bad Request",
      message: "username, password, and password_confirmation are required",
    });
  }

  if (password !== password_confirmation) {
    return res.status(400).json({
      error: "Bad Request",
      message: "password and password_confirmation do not match",
    });
  }

  const existingUser = db.get("users").find({ username }).value();
  if (existingUser) {
    return res.status(400).json({
      error: "Bad Request",
      message: "username already taken",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: uuidv4(),
    username,
    password: hashedPassword,
    created_at: new Date().toISOString(),
  };

  db.get("users").push(newUser).write();

  return res.status(201).json({
    message: "User registered successfully",
    data: { id: newUser.id, username: newUser.username },
  });
}

function generateTokens(user) {
  const authentication_token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );

  const refresh_token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN },
  );

  return { authentication_token, refresh_token };
}

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Bad Request",
      message: "username and password are required",
    });
  }

  const user = db.get("users").find({ username }).value();
  if (!user) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid username or password",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid username or password",
    });
  }

  const tokens = generateTokens(user);

  return res.status(200).json({
    message: "Login successful",
    ...tokens,
  });
}
