import express from "express";

import { getReportWorkList, updateWorkStatus } from "../controllers/postsReportController.js";
import { jwtMiddleware } from "../middlewares/jwtMiddleware.js";

const routerReportWork = express.Router();

routerReportWork.use(jwtMiddleware);

routerReportWork.get("/", getReportWorkList);
routerReportWork.patch("/status/:id", updateWorkStatus);

export default routerReportWork;