import express from "express";

import { getReportWorkList, lockPost, updateWorkStatus } from "../controllers/postsReportController.js";
import { jwtMiddleware } from "../middlewares/jwtMiddleware.js";

const routerReportWork = express.Router();

routerReportWork.use(jwtMiddleware);

routerReportWork.get("/", getReportWorkList);
routerReportWork.patch("/status/:id", updateWorkStatus);
routerReportWork.patch("/lock/:id", lockPost);

export default routerReportWork;