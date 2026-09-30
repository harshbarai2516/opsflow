import { Router } from "express";
import {
  getEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
} from "../controllers/employee.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getEmployees);

router.post("/", authenticate, createEmployee);

router.get("/:id", authenticate, getEmployeeById);

router.patch("/:id",  authenticate, updateEmployee);

router.delete("/:id",  authenticate,  deleteEmployee);

export default router;