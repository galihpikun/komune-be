import express from "express";

import {
  getCommentsByPost,
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";
import { jwtMiddleware } from "../middlewares/jwtMiddleware.js";

const routerComment = express.Router();

routerComment.use(jwtMiddleware);

routerComment.get("/post/:postId", getCommentsByPost);

routerComment.post(
  "/",
  createComment,
);

routerComment.patch(
  "/:id",
  updateComment,
);

routerComment.delete(
  "/:id",
  deleteComment,
);

export default routerComment;
