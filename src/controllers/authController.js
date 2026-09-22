import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import db from "../config/database.js";

function generateTokens(user) {
  const payload = { id: user.id, username: user.username };

  return {
    authentication_token: jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }),
    refresh_token: jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    }),
  };
}

export async function register(req, res, next) {
  try {
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

    const existingUser = await db.query(
      "SELECT id FROM users WHERE username = $1",
      [username],
    );

    if (existingUser.rowCount > 0) {
      return res.status(400).json({
        error: "Bad Request",
        message: "username already taken",
      });
    }

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (id, username, password) VALUES ($1, $2, $3)",
      [id, username, hashedPassword],
    );

    return res.status(201).json({
      message: "User registered successfully",
      data: { id, username },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Bad Request",
        message: "username and password are required",
      });
    }

    const result = await db.query(
      "SELECT id, username, password FROM users WHERE username = $1",
      [username],
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid username or password",
      });
    }

    return res.status(200).json({
      message: "Login successful",
      ...generateTokens(user),
    });
  } catch (error) {
    next(error);
  }
}
