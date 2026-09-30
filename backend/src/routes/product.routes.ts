import { Router } from "express";

import {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  getProducts
);

router.post(
  "/",
  authenticate,
  createProduct
);

router.get(
  "/:id",
  authenticate,
  getProductById
);

router.patch(
  "/:id",
  authenticate,
  updateProduct
);

router.delete(
  "/:id",
  authenticate,
  deleteProduct
);

export default router;