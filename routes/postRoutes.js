import express from "express";
import {
  showSearchedPosts,
  getNewPostPage,
  createNewPostController,
  getEditPostPage,
  updatePostController,
  getDeletePostPage,
  deletePostController,
} from "../controllers/postController.js";

const router = express.Router();

router.get("/:channel_id/new-post", getNewPostPage);
router.post("/:channel_id/create-post", createNewPostController);

router.get("/:channel_id/edit/:post_id", getEditPostPage);
router.patch("/:channel_id/edit-post/:post_id", updatePostController);

router.get("/:channel_id/delete-post/:post_id", getDeletePostPage);
router.delete("/:channel_id/delete-post/:post_id", deletePostController);

router.post("/search-post", showSearchedPosts);

export default router;
