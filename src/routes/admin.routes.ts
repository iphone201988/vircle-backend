import express from "express";
import adminController from "../controllers/admin.controller";
import { adminAuthMiddleware } from "../middleware/adminAuth.middleware";
import validate from "../middleware/validate.middleware";
import adminSchema from "../schema/admin.schema";
import { add } from "date-fns";

const adminRouter = express.Router();

adminRouter.post(
  "/login",
  validate(adminSchema.loginAdminSchema),
  adminController.adminLogin
);

adminRouter.get(
  "/getAllUsers",
  adminAuthMiddleware,
  adminController.getAllUsers
);

adminRouter.get(
  "/getUserById/:userId",
  validate(adminSchema.commonParamsSchema),
  adminAuthMiddleware,
  adminController.getUserById
);

adminRouter.delete(
  "/deleteUser/:userId",
  validate(adminSchema.commonParamsSchema),
  adminAuthMiddleware,
  adminController.deleteUser
);

adminRouter.put(
  "/activateOrDeactivateUser/:userId",
  validate(adminSchema.commonParamsSchema),
  adminAuthMiddleware,
  adminController.activateOrDeactivateUser
);

adminRouter.get(
  "/getAllAiContacts",
  adminAuthMiddleware,
  adminController.getAllAiContacts
);

adminRouter.get(
  "/getAiContactById/:contactId",
  adminAuthMiddleware,
  adminController.getAiContactById
);

adminRouter.get(
  "/getAnalysticsInsights",
  adminAuthMiddleware,
  adminController.getAnalysticsInsights
);

adminRouter.put(
  "/updateAiContact/:id",
  adminAuthMiddleware,
  adminController.updateAiContact
);

adminRouter.delete(
  "/deleteAiContact/:id",
  adminAuthMiddleware,
  adminController.deleteAiContact
);

adminRouter.get(
  "/getContacts",
  adminAuthMiddleware,
  adminController.getContacts
);

export default adminRouter;
