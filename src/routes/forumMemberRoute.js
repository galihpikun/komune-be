import express from "express";

import {
  joinForum,
  leaveForum,
  getPendingMembers,
  approveMember,
  rejectMember,
} from "../controllers/forumMemberController.js";
import { jwtMiddleware } from "../middlewares/jwtMiddleware.js";

const routerForumMember = express.Router();

routerForumMember.use(jwtMiddleware);

routerForumMember.post("/join/:forumId", joinForum);
routerForumMember.delete("/leave/:forumId", leaveForum);
routerForumMember.get("/pending/:forumId", getPendingMembers);
routerForumMember.patch("/approve/:memberId", approveMember);
routerForumMember.patch("/reject/:memberId", rejectMember);

export default routerForumMember;
