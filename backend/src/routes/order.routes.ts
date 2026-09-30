import { Router } from "express";

import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  getOrders
);

router.post(
  "/",
  authenticate,
  createOrder
);

router.get(
  "/:id",
  authenticate,
  getOrderById
);

router.patch(
  "/:id/status",
  authenticate,
  updateOrderStatus
);

export default router;