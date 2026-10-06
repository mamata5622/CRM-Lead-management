const express = require("express");

const {
  createLead,
  getLeadById,
  updateLead,
  getallLeads,
  deleteLead,
} = require("../controllers/leadController");

const leadRoutes = express.Router();

// CREATE
leadRoutes.post("/create", createLead);

// GET ALL
leadRoutes.get("/", getallLeads);

// GET ONE
leadRoutes.get("/:id", getLeadById);

// UPDATE
leadRoutes.put("/:id", updateLead);

// DELETE
leadRoutes.delete("/:id", deleteLead);

module.exports = leadRoutes;