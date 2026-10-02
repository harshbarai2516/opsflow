import { Router } from "express";

import {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();




router.get(
  "/",
  authenticate,
  authorize("ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"),
  getProducts
);

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  createProduct
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  getProductById
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  updateProduct
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  deleteProduct
);

export default router;