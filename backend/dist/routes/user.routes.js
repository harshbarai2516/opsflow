import { Router } from "express";
import { getUsers, getUserById, updateUser, deleteUser, } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
const router = Router();
router.get("/", authenticate, getUsers);
router.get("/:id", authenticate, getUserById);
router.patch("/:id", authenticate, authorize("ADMIN"), updateUser);
router.patch("/:id", authenticate, authorize("ADMIN"), deleteUser);
export default router;
//# sourceMappingURL=user.routes.js.map