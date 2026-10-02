import { Router } from "express";
import { getEmployees, createEmployee, getEmployeeById, updateEmployee, deleteEmployee } from "../controllers/employee.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
const router = Router();
router.get("/", authenticate, authorize("ADMIN", "MANAGER"), getEmployees);
router.post("/", authenticate, authorize("ADMIN", "MANAGER"), createEmployee);
router.put("/:id", authenticate, authorize("ADMIN", "MANAGER"), updateEmployee);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteEmployee);
export default router;
//# sourceMappingURL=employee.routes.js.map