import { Router } from "express";

import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { authorize } from "../middleware/role.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"),
  getOrders
);

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "MANAGER", "EMPLOYEE"),
  createOrder
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  updateOrderStatus
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "MANAGER", "EMPLOYEE"),
  getOrderById
);

export default router;