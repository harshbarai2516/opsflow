import { Router } from "express";

import {
  createInventoryTransaction,
  getInventoryTransactions,
  getProductInventoryHistory,
} from "../controllers/inventory.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  getInventoryTransactions
);

router.post(
  "/",
  authenticate,
  createInventoryTransaction
);

router.get(
  "/product/:productId",
  authenticate,
  getProductInventoryHistory
);

export default router;