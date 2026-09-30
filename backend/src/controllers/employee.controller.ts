import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function getEmployees(
  _req: Request,
  res: Response
) {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error("GET EMPLOYEES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
    });
  }
}

export async function createEmployee(
  req: Request,
  res: Response
) {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      joiningDate,
      salary,
      status,
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message:
          "First name, last name and email are required",
      });
    }

    const existingEmployee =
      await prisma.employee.findUnique({
        where: {
          email,
        },
      });

    if (existingEmployee) {
      return res.status(409).json({
        success: false,
        message:
          "Employee with this email already exists",
      });
    }

    const data = {
      firstName,
      lastName,
      email,
      ...(phone && { phone }),
      ...(department && { department }),
      ...(designation && { designation }),
      ...(joiningDate && {
        joiningDate: new Date(joiningDate),
      }),
      ...(salary !== undefined &&
        salary !== null && {
          salary: Number(salary),
        }),
      ...(status && { status }),
    };

    const employee = await prisma.employee.create({
      data,
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    console.error(
      "CREATE EMPLOYEE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create employee",
    });
  }
}

export async function getEmployeeById(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const employee = await prisma.employee.findUnique({
      where: {
        id,
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error(
      "GET EMPLOYEE BY ID ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee",
    });
  }
}

export async function updateEmployee(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      joiningDate,
      salary,
      status,
    } = req.body;

    const existingEmployee =
      await prisma.employee.findUnique({
        where: { id },
      });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (email && email !== existingEmployee.email) {
      const emailExists =
        await prisma.employee.findUnique({
          where: { email },
        });

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message:
            "Email already belongs to another employee",
        });
      }
    }

    const employee = await prisma.employee.update({
      where: { id },

      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(department !== undefined && { department }),
        ...(designation !== undefined && { designation }),

        ...(joiningDate !== undefined && {
          joiningDate: joiningDate
            ? new Date(joiningDate)
            : null,
        }),

        ...(salary !== undefined && {
          salary:
            salary === null
              ? null
              : Number(salary),
        }),

        ...(status !== undefined && { status }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    console.error("UPDATE EMPLOYEE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update employee",
    });
  }
}

export async function deleteEmployee(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const existingEmployee =
      await prisma.employee.findUnique({
        where: { id },
      });

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    await prisma.employee.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("DELETE EMPLOYEE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete employee",
    });
  }
}