import express from "express";
import { getUsers, getUserById, updateUserAdmin, updateMe,deleteUserAdmin, deleteMe } from "../controllers/userController.js";
import {jwtMiddleware} from "../middlewares/jwtMiddleware.js";

const routeUser = express.Router();

routeUser.use(jwtMiddleware);

routeUser.get("/get-users", getUsers);
routeUser.get("/:id", getUserById);
routeUser.put("/admin/:id", updateUserAdmin);
routeUser.put("/side/:id", updateMe);
routeUser.delete("/admin/:id", deleteUserAdmin);
routeUser.delete("/side/:id", deleteMe);

export default routeUser;