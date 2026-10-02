import { Router } from "express";
import { createInventoryTransaction, getInventoryTransactions, getProductInventoryHistory, } from "../controllers/inventory.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
const router = Router();
router.get("/", authenticate, authorize("ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"), getInventoryTransactions);
router.post("/", authenticate, authorize("ADMIN", "MANAGER", "EMPLOYEE"), createInventoryTransaction);
router.get("/product/:productId", authenticate, authorize("ADMIN", "MANAGER", "EMPLOYEE"), getProductInventoryHistory);
export default router;
//# sourceMappingURL=inventory.routes.js.map