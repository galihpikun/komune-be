import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { jwtMiddleware } from "../middlewares/jwtMiddleware.js";

const routeDash = express.Router();

routeDash.use(jwtMiddleware);

routeDash.get("/dashboard", getDashboardStats)

export default routeDash;