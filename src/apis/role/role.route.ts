import { roleRegisterPath } from "./role.swagger";
import roleController from "./role.controller";
import { Router } from "express";
const router = Router();

roleRegisterPath()

router.get("/", roleController.getAllRoles);
router.get("/id/:id", roleController.getRoleById);
router.get("/name/:name", roleController.getRoleByName);

export default router;