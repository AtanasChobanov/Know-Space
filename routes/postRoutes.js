import express from "express";
import PostController from "../controllers/postController.js";
import { uploadFiles } from "../config/multer.js";

const router = express.Router();

router.get("/", PostController.getFeed);

router.get("/:channelId/new-post", PostController.getNewPostPage);
router.post("/:channelId/create-post", uploadFiles, PostController.create);

router.get("/:channelId/edit/:postId", PostController.getEditPostPage);
router.patch("/:channelId/edit-post/:postId", uploadFiles, PostController.update);

router.get("/:channelId/delete-post/:postId", PostController.getDeletePostPage);
router.delete("/:channelId/delete-post/:postId", PostController.delete);

router.post("/search-post/:channelId", PostController.showSearchedPosts);

router.post("/posts/:postId/vote", PostController.vote);
router.get("/posts/:postId/votes", PostController.getPostVotes);

export default router;
