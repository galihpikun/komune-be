
import express from "express";
import { getForums,getForumById,createForum,deleteForum,updateForum } from "../controllers/forumController.js";
import { uploadForum } from "../middlewares/uploadMiddleware.js";
import { jwtMiddleware } from "../middlewares/jwtMiddleware.js";

const routerForum = express.Router();

routerForum.use(jwtMiddleware);

routerForum.get("/", getForums);
routerForum.get("/:id", getForumById);
routerForum.post(
    "/",
    uploadForum.fields([
        { name: "icon_image", maxCount: 1 },
        { name: "banner_image", maxCount: 1 }
    ]),
    createForum
);
routerForum.put(
    "/:id",
    uploadForum.fields([
        { name: "icon_image", maxCount: 1 },
        { name: "banner_image", maxCount: 1 }
    ]),
    updateForum
);

routerForum.delete("/:id", deleteForum);


export default routerForum;