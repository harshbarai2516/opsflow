import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

interface AuthPayload {
  userId: number;
  role: string;
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const decoded = jwt.verify(token, jwtSecret) as AuthPayload;

    req.user = decoded;

    next();
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}