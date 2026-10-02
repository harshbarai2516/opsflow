import { Router } from "express";

import {
    getAnalyticsSummary,
} from "../controllers/analytics.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.get(
  "/summary",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  getAnalyticsSummary
);
export default router;