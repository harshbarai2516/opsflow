import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function getUsers(
  _req: Request,
  res: Response
) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
}

// export async function createUser(
//   req: Request,
//   res: Response
// ) {
//   try {
//     const { email, password, role } = req.body;

//     const user = await prisma.user.create({
//       data: {
//         email,
//         password,
//         role: role || "EMPLOYEE",
//       },
//       select: {
//         id: true,
//         email: true,
//         role: true,
//         createdAt: true,
//         updatedAt: true,
//       },
//     });

//     res.status(201).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     console.error("CREATE USER ERROR:", error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to create user",
//     });
//   }
// }

export async function getUserById(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("GET USER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
}


export async function updateUser(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    const { email, role } = req.body;

    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        ...(email !== undefined && { email }),
        ...(role !== undefined && { role }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
}

export async function deleteUser(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await prisma.user.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
}