import { Router } from "express";

import {
  createPayment,
  getPaymentById,
  getPayments,
} from "../controllers/payment.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";



const router = Router();

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  getPayments
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  getPaymentById
);

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  createPayment
);

export default router;