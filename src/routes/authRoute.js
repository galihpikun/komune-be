import express from "express";
import { register, login, logout } from "../controllers/authController.js";

const routeAuth = express.Router();

routeAuth.post("/register", register);
routeAuth.post("/login", login);
routeAuth.delete("/log-out", logout);

export default routeAuth;