import express from "express";
import PostController from "../controllers/postController.js";
import { uploadFiles } from "../config/multer.js";
import multer from "multer";

const router = express.Router();

router.get("/", PostController.getFeedController);

router.get("/:channelId/new-post", PostController.getNewPostPage);
router.post("/:channelId/create-post", (req, res, next) => {
  uploadFiles(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).render("new-post.ejs", {
          errorMessage: "Файлът е твърде голям. Максимум 5MB.",
          title: req.body.title,
          content: req.body.content,
          channelId: req.params.channelId,
        });
      } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).render("new-post.ejs", {
          errorMessage: "Не може да се качват повече от 5 снимки.",
          title: req.body.title,
          content: req.body.content,
          channelId: req.params.channelId,
        });
      }
    }
    next();
  });
}, PostController.createController);

router.get("/:channelId/edit/:postId", PostController.getEditPostPage);
router.patch(
  "/:channelId/edit-post/:postId",
  (req, res, next) => {
    uploadFiles(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).render("new-post.ejs", {
            errorMessage: "Файлът е твърде голям. Максимум 5MB.",
            title: req.body.title,
            content: req.body.content,
            channelId: req.params.channelId,
          });
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).render("new-post.ejs", {
            errorMessage: "Не може да се качват повече от 5 снимки.",
            title: req.body.title,
            content: req.body.content,
            channelId: req.params.channelId,
          });
        }
      }
      next();
    });
  },
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

router.post("/posts/:postId/vote", PostController.voteController);
router.get("/posts/:postId/votes", PostController.getPostVotesController);

export default router;
