import express from "express";

import {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    approvePost,
    rejectPost,
    getTrendingPosts,
    getUserPosts,
    getPostsMods
} from "../controllers/postController.js";
import { jwtMiddleware } from "../middlewares/jwtMiddleware.js";
import { uploadPost } from "../middlewares/uploadPostMiddleware.js";

const routerPost = express.Router();

routerPost.use(jwtMiddleware);

routerPost.get("/", getPosts);
routerPost.get("/moderation", getPostsMods);
routerPost.get("/trending", getTrendingPosts);
routerPost.get("/user-posts", getUserPosts);
routerPost.patch(
    "/approve/:id",
    approvePost
);
routerPost.patch(
    "/reject/:id",
    rejectPost
);
routerPost.get("/:id", getPostById);
routerPost.post(
    "/",
    uploadPost.array("images", 10),
    createPost
);
routerPost.patch(
    "/:id",
    uploadPost.array("images", 10),
    updatePost
);
routerPost.delete(
    "/:id",
    deletePost
);


export default routerPost;