import express from "express";
import { 
    getNotifications, 
    deleteNotification, 
    clearAllNotifications 
} from "../controllers/notificationController.js";
import { jwtMiddleware } from "../middlewares/jwtMiddleware.js";

const routerNotification = express.Router();


routerNotification.use(jwtMiddleware);

routerNotification.get("/", getNotifications);
routerNotification.delete("/clear-all", clearAllNotifications); 
routerNotification.delete("/:id", deleteNotification);

export default routerNotification;