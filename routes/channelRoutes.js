import express from "express";
import {
  viewChannels,
  getNewChannelPage,
  createChannelController,
  viewChannelPosts,
  searchChannelsController,
  joinChannelController,
  leaveChannelController,
  getEditChannelPage,
  updateChannelConroller,
  getDeleteChannelPage,
  deleteChannelConroller,
} from "../controllers/channelController.js";

const router = express.Router();

// Начална страница за всички канали
router.get("/", viewChannels);

router.get("/view/:channel_id", viewChannelPosts);

router.get("/new-channel", getNewChannelPage);
router.post("/create-channel", createChannelController);

router.post("/search-channel", searchChannelsController);

router.post("/join-channel/:channel_id", joinChannelController);
router.delete("/leave-channel/:channel_id", leaveChannelController);

router.get("/:channel_id/edit", getEditChannelPage);
router.patch("/:channel_id/edit", updateChannelConroller);

router.get("/:channel_id/delete", getDeleteChannelPage);
router.delete("/:channel_id/delete", deleteChannelConroller);

export default router;
