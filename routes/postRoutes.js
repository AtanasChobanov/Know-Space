import express from "express";
import PostController from "../controllers/postController.js";

const router = express.Router();

router.get("/:channelId/new-post", PostController.getNewPostPage);
router.post("/:channelId/create-post", PostController.createController);

router.get("/:channelId/edit/:postId", PostController.getEditPostPage);
router.patch(
  "/:channelId/edit-post/:postId",
  PostController.updateController
);

router.get(
  "/:channelId/delete-post/:postId",
  PostController.getDeletePostPage
);
router.delete(
  "/:channelId/delete-post/:postId",
  PostController.deleteController
);

router.post("/search-post/:channelId", PostController.showSearchedPostsController);

export default router;
