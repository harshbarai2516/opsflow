import { Router } from "express";

import {
  getCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getCustomers);

router.post("/", authenticate, createCustomer);

router.get("/:id", authenticate, getCustomerById);

router.patch("/:id", authenticate, updateCustomer);

router.delete("/:id", authenticate, deleteCustomer);

export default router;