import express from "express";

import {
    getReports,
    createReport,
    resolveReport,
    reviewReport,
    deleteReport
} from "../controllers/reportController.js";

import { jwtMiddleware } from "../middlewares/jwtMiddleware.js";

const routerReport = express.Router();

routerReport.get(
    "/",
    jwtMiddleware,
    getReports
);

routerReport.post(
    "/",
    jwtMiddleware,
    createReport
);

routerReport.patch(
    "/review/:id",
    jwtMiddleware,
    reviewReport
);

routerReport.patch(
    "/resolve/:id",
    jwtMiddleware,
    resolveReport
);

routerReport.delete(
    "/:id",
    jwtMiddleware,
    deleteReport
);

export default routerReport;