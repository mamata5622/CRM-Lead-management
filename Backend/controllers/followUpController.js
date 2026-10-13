const mongoose = require("mongoose");
const FollowUp = require("../models/followUpModel");
const { CHANNELS } = require("../models/followUpModel");
const Lead = require("../models/leadModel");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getUserId = (req) => req.user?.id || req.user?._id || null;

const populateFollowUp = (query) =>
    query
        .populate("lead", "name company email phone")
        .populate("assignedTo", "name fullName email")
        .populate("createdBy", "name fullName email")
        .populate("notes.createdBy", "name fullName email")
        .populate("communications.createdBy", "name fullName email");

const sendError = (res, error, message = "Server error") => {
    console.error(message, error);
    return res.status(500).json({ success: false, message });
};


exports.getAllFollowUps = async (req, res) => {
    try {
        const {
            search = "",
            channel = "",
            status = "",
            priority = "",
            archived = "false",
            page = 1,
            limit = 20,
        } = req.query;

        const filter = {
            isArchived: archived === "true",
        };

        if (channel && CHANNELS.includes(channel)) filter.channel = channel;
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        const pageNumber = Math.max(Number(page) || 1, 1);
        const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);

        let query = FollowUp.find(filter)
            .sort({ dueDate: 1, createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        const [items, total] = await Promise.all([
            populateFollowUp(query),
            FollowUp.countDocuments(filter),
        ]);

        let followUps = items;

        if (search.trim()) {
            const regex = new RegExp(
                search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "i"
            );

            followUps = items.filter((item) => {
                const lead = item.lead || {};
                return (
                    regex.test(item.title || "") ||
                    regex.test(item.description || "") ||
                    regex.test(item.channel || "") ||
                    regex.test(lead.name || "") ||
                    regex.test(lead.company || "") ||
                    regex.test(lead.email || "") ||
                    regex.test(lead.phone || "")
                );
            });
        }

        return res.json({
            success: true,
            followUps,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                pages: Math.ceil(total / limitNumber),
            },
        });
    } catch (error) {
        return sendError(res, error, "Could not fetch follow-ups");
    }
};

// GET /admin/follow-ups/stats
exports.getFollowUpStats = async (req, res) => {
    try {
        const activeFilter = { isArchived: false };
        const now = new Date();

        const [total, pending, inProgress, completed, cancelled, overdue, byChannel] =
            await Promise.all([
                FollowUp.countDocuments(activeFilter),
                FollowUp.countDocuments({ ...activeFilter, status: "Pending" }),
                FollowUp.countDocuments({ ...activeFilter, status: "In Progress" }),
                FollowUp.countDocuments({ ...activeFilter, status: "Completed" }),
                FollowUp.countDocuments({ ...activeFilter, status: "Cancelled" }),
                FollowUp.countDocuments({
                    ...activeFilter,
                    status: { $in: ["Pending", "In Progress"] },
                    dueDate: { $lt: now },
                }),
                FollowUp.aggregate([
                    { $match: activeFilter },
                    { $group: { _id: "$channel", count: { $sum: 1 } } },
                ]),
            ]);

        return res.json({
            success: true,
            stats: {
                total,
                pending,
                inProgress,
                completed,
                cancelled,
                overdue,
                byChannel: byChannel.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
            },
        });
    } catch (error) {
        return sendError(res, error, "Could not fetch follow-up statistics");
    }
};

// GET /admin/follow-ups/:id
exports.getFollowUpById = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid follow-up ID" });
        }

        const followUp = await populateFollowUp(
            FollowUp.findById(req.params.id)
        );

        if (!followUp) {
            return res.status(404).json({ success: false, message: "Follow-up not found" });
        }

        return res.json({ success: true, followUp });
    } catch (error) {
        return sendError(res, error, "Could not fetch follow-up");
    }
};

// POST /admin/follow-ups/create
exports.createFollowUp = async (req, res) => {
    try {
        const {
            lead,
            title,
            description = "",
            channel,
            priority = "Medium",
            dueDate,
            reminderAt,
            assignedTo,
        } = req.body;

        if (!lead || !isValidId(lead)) {
            return res.status(400).json({ success: false, message: "Select a valid lead" });
        }

        if (!title?.trim()) {
            return res.status(400).json({ success: false, message: "Title is required" });
        }

        if (!channel || !CHANNELS.includes(channel)) {
            return res.status(400).json({
                success: false,
                message: "Title and a valid communication channel are required",
            });
        }

        if (!["Low", "Medium", "High", "Urgent"].includes(priority)) {
            return res.status(400).json({ success: false, message: "Invalid priority" });
        }

        const leadExists = await Lead.findById(lead);
        if (!leadExists) {
            return res.status(404).json({ success: false, message: "Lead not found" });
        }

        if (assignedTo && !isValidId(assignedTo)) {
            return res.status(400).json({ success: false, message: "Invalid assigned user ID" });
        }

        const created = await FollowUp.create({
            lead,
            title: title.trim(),
            description: description.trim(),
            channel,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null,
            reminderAt: reminderAt ? new Date(reminderAt) : null,
            assignedTo: assignedTo || null,
            createdBy: getUserId(req),
        });

        const followUp = await populateFollowUp(FollowUp.findById(created._id));

        return res.status(201).json({
            success: true,
            message: "Follow-up created successfully",
            followUp,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ success: false, message: error.message });
        }
        return sendError(res, error, "Could not create follow-up");
    }
};

// PUT /admin/follow-ups/:id
exports.updateFollowUp = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid follow-up ID" });
        }

        const allowedFields = [
            "title",
            "description",
            "channel",
            "priority",
            "dueDate",
            "reminderAt",
            "assignedTo",
        ];

        const update = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) update[field] = req.body[field];
        }

        if (update.title !== undefined) {
            if (!String(update.title).trim()) {
                return res.status(400).json({ success: false, message: "Title is required" });
            }
            update.title = String(update.title).trim();
        }

        if (update.channel !== undefined && !CHANNELS.includes(update.channel)) {
            return res.status(400).json({ success: false, message: "Invalid communication channel" });
        }

        if (update.dueDate !== undefined) {
            update.dueDate = update.dueDate ? new Date(update.dueDate) : null;
        }

        if (update.reminderAt !== undefined) {
            update.reminderAt = update.reminderAt ? new Date(update.reminderAt) : null;
        }

        if (update.assignedTo !== undefined) {
            if (update.assignedTo && !isValidId(update.assignedTo)) {
                return res.status(400).json({ success: false, message: "Invalid assigned user ID" });
            }
            update.assignedTo = update.assignedTo || null;
        }

        const followUp = await FollowUp.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
        });

        if (!followUp) {
            return res.status(404).json({ success: false, message: "Follow-up not found" });
        }

        const populated = await populateFollowUp(FollowUp.findById(followUp._id));

        return res.json({
            success: true,
            message: "Follow-up updated successfully",
            followUp: populated,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ success: false, message: error.message });
        }
        return sendError(res, error, "Could not update follow-up");
    }
};

// POST /admin/follow-ups/:id/notes
exports.addFollowUpNote = async (req, res) => {
    try {
        const { id } = req.params;
        const text = req.body.text?.trim();

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid follow-up ID" });
        }
        if (!text) {
            return res.status(400).json({ success: false, message: "Note text is required" });
        }

        const followUp = await FollowUp.findById(id);
        if (!followUp) {
            return res.status(404).json({ success: false, message: "Follow-up not found" });
        }

        followUp.notes.push({ text, createdBy: getUserId(req) });
        await followUp.save();

        const populated = await populateFollowUp(FollowUp.findById(id));

        return res.status(201).json({
            success: true,
            message: "Note added successfully",
            followUp: populated,
        });
    } catch (error) {
        return sendError(res, error, "Could not add note");
    }
};

// POST /admin/follow-ups/:id/communications
exports.addCommunication = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            channel,
            direction = "Outgoing",
            subject = "",
            message,
            outcome = "",
            communicatedAt,
        } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid follow-up ID" });
        }
        if (!CHANNELS.includes(channel)) {
            return res.status(400).json({ success: false, message: "Select a valid channel" });
        }
        if (!message?.trim()) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }
        if (!["Incoming", "Outgoing", "Internal"].includes(direction)) {
            return res.status(400).json({ success: false, message: "Invalid communication direction" });
        }

        const followUp = await FollowUp.findById(id);
        if (!followUp) {
            return res.status(404).json({ success: false, message: "Follow-up not found" });
        }

        followUp.communications.push({
            channel,
            direction,
            subject: subject.trim(),
            message: message.trim(),
            outcome: outcome.trim(),
            communicatedAt: communicatedAt ? new Date(communicatedAt) : new Date(),
            createdBy: getUserId(req),
        });

        await followUp.save();

        const populated = await populateFollowUp(FollowUp.findById(id));

        return res.status(201).json({
            success: true,
            message: "Communication added to timeline",
            followUp: populated,
        });
    } catch (error) {
        return sendError(res, error, "Could not add communication");
    }
};

// PATCH /admin/follow-ups/:id/status
exports.updateFollowUpStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, completionOutcome = "" } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid follow-up ID" });
        }

        const allowed = ["Pending", "In Progress", "Completed", "Cancelled"];
        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const followUp = await FollowUp.findById(id);
        if (!followUp) {
            return res.status(404).json({ success: false, message: "Follow-up not found" });
        }

        followUp.status = status;
        followUp.completionOutcome = completionOutcome.trim();

        if (status === "Completed") {
            followUp.completedAt = new Date();
        } else {
            followUp.completedAt = null;
        }

        await followUp.save();

        const populated = await populateFollowUp(FollowUp.findById(id));

        return res.json({
            success: true,
            message: "Status updated successfully",
            followUp: populated,
        });
    } catch (error) {
        return sendError(res, error, "Could not update status");
    }
};

// PATCH /admin/follow-ups/:id/archive
exports.toggleFollowUpArchive = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid follow-up ID" });
        }

        const followUp = await FollowUp.findById(id);
        if (!followUp) {
            return res.status(404).json({ success: false, message: "Follow-up not found" });
        }

        followUp.isArchived = !followUp.isArchived;
        await followUp.save();

        return res.json({
            success: true,
            message: followUp.isArchived ? "Follow-up archived" : "Follow-up restored",
            isArchived: followUp.isArchived,
        });
    } catch (error) {
        return sendError(res, error, "Could not archive follow-up");
    }
};