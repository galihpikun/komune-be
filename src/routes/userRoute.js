import express from "express";
import { getUsers, getUserById, updateUserAdmin, updateMe,deleteUserAdmin, deleteMe, createUser, getAvatar, getMe, uploadAvatar } from "../controllers/userController.js";
import {jwtMiddleware} from "../middlewares/jwtMiddleware.js";
import { uploadAvatarMiddleware } from "../middlewares/uploadAvatarMiddleware.js";

const routeUser = express.Router();

routeUser.use(jwtMiddleware);

routeUser.get("/get-users", getUsers);
routeUser.post("/admin-create", createUser);
routeUser.get("/get-avatar", getAvatar);
routeUser.get("/get-me", getMe);
routeUser.delete("/side/delete", deleteMe);
routeUser.put("/side/update", updateMe);
routeUser.put(
  "/upload-avatar",
  uploadAvatarMiddleware.single("avatar"),
  uploadAvatar
);
routeUser.get("/:id", getUserById);
routeUser.put("/admin/:id", updateUserAdmin);
routeUser.delete("/admin/:id", deleteUserAdmin);


export default routeUser;