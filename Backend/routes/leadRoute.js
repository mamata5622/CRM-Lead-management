const express = require("express");

const {
  createLead,
  getLeadById,
  updateLead,
  getallLeads,
  deleteLead,
} = require("../controllers/leadController");
const { isLoginUser, isAdmin } = require("../middleware/authMiddleware");

const leadRoutes = express.Router();

// CREATE
leadRoutes.post("/create",isLoginUser,isAdmin, createLead);

// GET ALL
leadRoutes.get("/",isLoginUser,isAdmin, getallLeads);

// GET ONE
leadRoutes.get("/:id",isLoginUser,isAdmin, getLeadById);

// UPDATE
leadRoutes.put("/:id",isLoginUser,isAdmin, updateLead);

// DELETE
leadRoutes.delete("/:id",isLoginUser,isAdmin, deleteLead);

module.exports = leadRoutes;