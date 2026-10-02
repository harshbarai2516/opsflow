import { Router } from "express";
import { authorize } from "../middleware/role.middleware.js";
import { createInvoice, getInvoiceById, getInvoices, } from "../controllers/invoice.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
const router = Router();
router.get("/", authenticate, authorize("ADMIN", "MANAGER"), getInvoices);
router.get("/:id", authenticate, authorize("ADMIN", "MANAGER"), getInvoiceById);
router.post("/", authenticate, authorize("ADMIN", "MANAGER"), createInvoice);
export default router;
//# sourceMappingURL=invoice.routes.js.map