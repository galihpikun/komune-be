import express from "express";

import {
    reactComment,
    getCommentReactions
} from "../controllers/commentReactController.js";

import { jwtMiddleware } from "../middlewares/jwtMiddleware.js";

const routerCommentReaction =
    express.Router();

routerCommentReaction.post(
    "/:commentId",
    jwtMiddleware,
    reactComment
);

routerCommentReaction.get(
    "/:commentId",
    getCommentReactions
);

export default routerCommentReaction;