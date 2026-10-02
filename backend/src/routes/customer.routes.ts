import { Router } from "express";

import {
  getCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller.js";
import { authorize } from "../middleware/role.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"),
  getCustomers
);

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "MANAGER", "EMPLOYEE"),
  createCustomer
);

router.get(
  "/:id",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  getCustomerById
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "MANAGER", "EMPLOYEE"),
  updateCustomer
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  deleteCustomer
);




export default router;