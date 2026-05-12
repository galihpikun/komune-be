import express from "express";

import {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    approvePost,
    rejectPost
} from "../controllers/postController.js";
import { jwtMiddleware } from "../middlewares/jwtMiddleware.js";
import { uploadPost } from "../middlewares/uploadPostMiddleware.js";

const routerPost = express.Router();

routerPost.use(jwtMiddleware);

routerPost.get("/", getPosts);
routerPost.get("/:id", getPostById);
routerPost.post(
    "/",
    jwtMiddleware,
    uploadPost.array("images", 10),
    createPost
);
routerPost.patch(
    "/:id",
    jwtMiddleware,
    uploadPost.array("images", 10),
    updatePost
);
routerPost.delete(
    "/:id",
    jwtMiddleware,
    deletePost
);
routerPost.patch(
    "/approve/:id",
    jwtMiddleware,
    approvePost
);
routerPost.patch(
    "/reject/:id",
    jwtMiddleware,
    rejectPost
);

export default routerPost;