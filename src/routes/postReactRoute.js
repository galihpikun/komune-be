import express from "express";

import {
    reactPost,
    getPostReactions
} from "../controllers/postReactController.js";

import { jwtMiddleware } from "../middlewares/jwtMiddleware.js";

const routerPostReaction = express.Router();

routerPostReaction.post(
    "/:postId",
    jwtMiddleware,
    reactPost
);

routerPostReaction.get(
    "/:postId",
    getPostReactions
);

export default routerPostReaction;