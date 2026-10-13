
const mongoose = require("mongoose");
const Lead = require("../models/leadModel");
const Counter = require("../models/counterModel");

const isValidObjectId = (id) =>
  mongoose.isValidObjectId(id);


const getNextLeadId = async () => {
  // Find the highest existing lead ID, including older records.
  const lastLead = await Lead.findOne()
    .sort({ id: -1 })
    .select("id")
    .lean();

  const highestExistingId = Number(lastLead?.id || 0);

  // Create the counter if it doesn't exist.
  try {
    await Counter.updateOne(
      { _id: "lead" },
      { $setOnInsert: { seq: highestExistingId } },
      { upsert: true }
    );
  } catch (error) {
    // Another request may have created the counter simultaneously.
    if (error.code !== 11000) throw error;
  }

  // Repair a stale counter, for example after importing old leads.
  await Counter.updateOne(
    { _id: "lead", seq: { $lt: highestExistingId } },
    { $set: { seq: highestExistingId } }
  );

  // Atomically allocate the next ID.
  const counter = await Counter.findOneAndUpdate(
    { _id: "lead" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  if (!counter) {
    throw new Error("Failed to generate the next lead ID.");
  }

  return counter.seq;
};

const validateLeadPayload = (body, isCreate = false) => {
  const payload = { ...body };

  if (payload.name !== undefined || isCreate) {
    payload.name = String(payload.name ?? "").trim();

    if (!payload.name) {
      return "Lead name is required.";
    }
  }

  if (payload.phone !== undefined || isCreate) {
    payload.phone = String(payload.phone ?? "").trim();
  }

  if (payload.email !== undefined || isCreate) {
    payload.email = String(payload.email ?? "")
      .trim()
      .toLowerCase();
  }

  if (isCreate && !payload.phone && !payload.email) {
    return "Enter a phone number or email address.";
  }

  if (!isCreate) {
    // Check the combined existing + updated values in updateLead.
    if (payload.phone === undefined) delete payload.phone;
    if (payload.email === undefined) delete payload.email;
  }

  if (payload.company !== undefined) {
    payload.company = String(payload.company ?? "").trim();
  }

  if (payload.location !== undefined) {
    payload.location = String(payload.location ?? "").trim();
  }

  if (payload.owner !== undefined) {
    payload.owner = String(payload.owner ?? "").trim();
  }

  if (payload.value !== undefined) {
    const value = Number(payload.value);

    if (!Number.isFinite(value) || value < 0) {
      return "Lead value must be a non-negative number.";
    }

    payload.value = value;
  }

  if (payload.followUp === "") {
    payload.followUp = null;
  } else if (payload.followUp) {
    const date = new Date(payload.followUp);

    if (Number.isNaN(date.getTime())) {
      return "Enter a valid follow-up date.";
    }

    payload.followUp = date;
  }

  return payload;
};

// POST /api/admin/leads/create
exports.createLead = async (req, res) => {
  try {
    const {
      name,
      company,
      phone,
      email,
      location,
      vertical,
      source,
      status,
      value,
      followUp,
      owner,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Lead name is required",
      });
    }

    if (!String(phone || "").trim() && !String(email || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Provide at least a phone number or email",
      });
    }

    const numericValue =
      value === "" || value === undefined || value === null
        ? 0
        : Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Lead value must be a valid non-negative number",
      });
    }

    const normalizedStatus =
      status === "Proposal Sent" ? "Proposal" : status || "New";

    const allowedStatuses = [
      "New",
      "Contacted",
      "Qualified",
      "Proposal",
      "Negotiation",
      "Won",
      "Lost",
    ];

    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid lead status: ${status}`,
      });
    }

    const leadId = await getNextLeadId();

    const lead = await Lead.create({
      id: leadId,
      name: name.trim(),
      company: company || "",
      phone: phone || "",
      email: email || "",
      location: location || "",
      vertical: vertical || "Real Estate",
      source: source || "Website",
      status: normalizedStatus,
      value: numericValue,
      followUp: followUp || null,
      owner: owner || "Unassigned",
    });

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    console.error("CREATE LEAD ERROR:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Lead validation failed",
        errors: Object.values(error.errors).map((item) => item.message),
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A duplicate lead ID or unique field already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create lead",
      error: error.message,
    });
  }
};


// GET /api/admin/leads
exports.getallLeads = async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leads.length,
      data: leads,
    });
  } catch (error) {
    console.error("Fetch leads error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch leads.",
    });
  }
};

// GET /api/admin/leads/:id
exports.getLeadById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error("Get lead error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch lead.",
    });
  }
};

// PUT /api/admin/leads/:id
exports.updateLead = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    const existing = await Lead.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Lead not found.",
      });
    }

    const payload = validateLeadPayload(req.body);

    if (typeof payload === "string") {
      return res.status(400).json({
        success: false,
        message: payload,
      });
    }

    // Prevent overwriting server-managed fields.
    [
      "id",
      "_id",
      "initials",
      "createdAt",
      "updatedAt",
      "__v",
      "overdue",
    ].forEach((key) => delete payload[key]);

    const phone =
      payload.phone !== undefined ? payload.phone : existing.phone;
    const email =
      payload.email !== undefined ? payload.email : existing.email;

    if (!String(phone ?? "").trim() && !String(email ?? "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Enter a phone number or email address.",
      });
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      payload,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Lead updated successfully.",
      data: lead,
    });
  } catch (error) {
    console.error("Update lead error:", error);

    return res.status(
      ["ValidationError", "CastError"].includes(error.name) ? 400 : 500
    ).json({
      success: false,
      message: "Failed to update lead.",
      error: error.message,
    });
  }
};

// DELETE /api/admin/leads/:id
exports.deleteLead = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID.",
      });
    }

    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lead deleted successfully.",
    });
  } catch (error) {
    console.error("Delete lead error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete lead.",
    });
  }
};
