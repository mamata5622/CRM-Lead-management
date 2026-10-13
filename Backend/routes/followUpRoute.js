// backend/routes/followUpRoute.js

const express = require("express");
const followUpRoute = express.Router();

const {
  getAllFollowUps,
  getFollowUpStats,
  getFollowUpById,
  createFollowUp,
  updateFollowUp,
  addFollowUpNote,
  addCommunication,
  updateFollowUpStatus,
  toggleFollowUpArchive,
} = require("../controllers/followUpController");

const { isLoginUser } = require("../middleware/authMiddleware");

// All routes require a valid JWT
followUpRoute.get("/", isLoginUser, getAllFollowUps);
followUpRoute.get("/stats", isLoginUser, getFollowUpStats);
followUpRoute.post("/create", isLoginUser, createFollowUp);

followUpRoute.post("/:id/communications", isLoginUser, addCommunication);
followUpRoute.post("/:id/notes", isLoginUser, addFollowUpNote);
followUpRoute.patch("/:id/status", isLoginUser, updateFollowUpStatus);
followUpRoute.patch("/:id/archive", isLoginUser, toggleFollowUpArchive);

followUpRoute.get("/:id", isLoginUser, getFollowUpById);
followUpRoute.put("/:id", isLoginUser, updateFollowUp);

module.exports = followUpRoute;