import express from "express";
import { getUsers, getUsersById, register, login } from "../controllers/authController.js";

const routeAuth = express.Router();

routeAuth.get("/get-users", getUsers);
routeAuth.get("/get-users/:id", getUsersById);
routeAuth.post("/register", register);
routeAuth.post("/login", login);

export default routeAuth;