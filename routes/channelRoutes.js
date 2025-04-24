import express from "express";
import ChannelController from "../controllers/channelController.js";
import { uploadFiles } from "../config/multer.js";

const router = express.Router();

router.get("/channels", ChannelController.viewChannels);
router.get("/explore", ChannelController.exploreChannels);

router.get("/view/:channelId", ChannelController.viewChannelPosts);

router.get("/new-channel", ChannelController.getNewChannelPage);
router.post("/create-channel", uploadFiles, ChannelController.create);

router.post("/search-channel", ChannelController.showSearchedChannels);

router.post("/join-channel/:channelId", ChannelController.joinChannel);
router.delete("/leave-channel/:channelId", ChannelController.leaveChannel);

router.get("/:channelId/edit", ChannelController.getEditChannelPage);
router.patch("/:channelId/edit", uploadFiles, ChannelController.update);

router.get("/:channelId/delete", ChannelController.getDeleteChannelPage);
router.delete("/:channelId/delete", ChannelController.delete);

export default router;
