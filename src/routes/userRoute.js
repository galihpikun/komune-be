import express from "express";
import { getUsers, getUserById, updateUserAdmin, deleteUser } from "../controllers/userController.js";
import {jwtMiddleware} from "../middlewares/jwtMiddleware.js";

const routeUser = express.Router();

routeUser.use(jwtMiddleware);

routeUser.get("/get-users", getUsers);
routeUser.get("/:id", getUserById);
routeUser.put("/:id", updateUserAdmin);
routeUser.delete("/:id", deleteUser);

export default routeUser;