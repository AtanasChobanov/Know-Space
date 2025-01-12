import express from "express";
import ChannelController from "../controllers/channelController.js";

const router = express.Router();

router.get("/", ChannelController.viewChannels);

router.get("/view/:channelId", ChannelController.viewChannelPosts);

router.get("/new-channel", ChannelController.getNewChannelPage);
router.post("/create-channel", ChannelController.createController);

router.post(
  "/search-channel",
  ChannelController.showSearchedChannelsController
);

router.post("/join-channel/:channelId", ChannelController.joinChannel);
router.delete("/leave-channel/:channelId", ChannelController.leaveChannel);

router.get("/:channelId/edit", ChannelController.getEditChannelPage);
router.patch("/:channelId/edit", ChannelController.updateController);

router.get("/:channelId/delete", ChannelController.getDeleteChannelPage);
router.delete("/:channelId/delete", ChannelController.deleteController);

export default router;
