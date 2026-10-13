

const mongoose = require("mongoose");
const SupportTicket = require("../models/supportTicketModel");

const getUserId = (req) => req.user?.id || req.user?._id;

const isAdmin = (req) => req.user?.role === "admin";

const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

exports.createSupportTicket = asyncHandler(async (req, res) => {
    const employeeId = getUserId(req);
    const { subject, category, priority, description } = req.body;

    if (!employeeId || !mongoose.isValidObjectId(employeeId)) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please log in again.",
        });
    }

    if (
        typeof subject !== "string" ||
        subject.trim().length < 3
    ) {
        return res.status(400).json({
            success: false,
            message: "Subject must contain at least 3 characters.",
        });
    }

    if (
        typeof description !== "string" ||
        description.trim().length < 10
    ) {
        return res.status(400).json({
            success: false,
            message: "Description must contain at least 10 characters.",
        });
    }

    const allowedCategories = [
        "Technical Issue",
        "Account Access",
        "CRM / Leads",
        "Follow-ups",
        "HR / Attendance",
        "Other",
    ];

    const allowedPriorities = ["Low", "Medium", "High", "Urgent"];

    const selectedCategory = category || "Other";
    const selectedPriority = priority || "Medium";

    if (!allowedCategories.includes(selectedCategory)) {
        return res.status(400).json({
            success: false,
            message: `Invalid category: ${selectedCategory}`,
        });
    }

    if (!allowedPriorities.includes(selectedPriority)) {
        return res.status(400).json({
            success: false,
            message: `Invalid priority: ${selectedPriority}`,
        });
    }

    const ticket = await SupportTicket.create({
        employee: employeeId,
        subject: subject.trim(),
        category: selectedCategory,
        priority: selectedPriority,
        description: description.trim(),
    });

    await ticket.populate("employee", "name email");

    return res.status(201).json({
        success: true,
        message: "Support ticket created successfully.",
        ticket,
    });
});


// EMPLOYEE: Get own tickets; ADMIN: Get all tickets
exports.getSupportTickets = asyncHandler(async (req, res) => {
    const {
        status,
        priority,
        search,
        page = 1,
        limit = 10,
    } = req.query;

    const filter = {};

    if (!isAdmin(req)) {
        filter.employee = getUserId(req);
    } else if (req.query.employee) {
        if (!mongoose.isValidObjectId(req.query.employee)) {
            return res.status(400).json({ message: "Invalid employee ID" });
        }
        filter.employee = req.query.employee;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;


    if (search?.trim()) {
        const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        filter.$or = [
            { ticketNumber: { $regex: escaped, $options: "i" } },
            { subject: { $regex: escaped, $options: "i" } },
            { description: { $regex: escaped, $options: "i" } },
        ];
    }


    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));

    const [tickets, total] = await Promise.all([
        SupportTicket.find(filter)
            .populate("employee", "name email")
            .populate("repliedBy", "name email")
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize)
            .lean(),
        SupportTicket.countDocuments(filter),
    ]);

    return res.status(200).json({
        tickets,
        pagination: {
            total,
            page: currentPage,
            limit: pageSize,
            totalPages: Math.ceil(total / pageSize),
        },
    });
});

// EMPLOYEE: Get one of own tickets; ADMIN: Get any ticket
exports.getSupportTicketById = asyncHandler(async (req, res) => {
    const ticket = await SupportTicket.findById(req.params.id)
        .populate("employee", "name email")
        .populate("repliedBy", "name email");

    if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
    }

    if (
        !isAdmin(req) &&
        ticket.employee._id.toString() !== String(getUserId(req))
    ) {
        return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({ ticket });
});

// ADMIN: Reply to ticket and update its status
exports.replyToSupportTicket = asyncHandler(async (req, res) => {
    const { adminReply, status } = req.body;

    const allowedStatuses = ["Open", "In Progress", "Resolved", "Closed"];

    if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid ticket status" });
    }

    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
    }

    if (adminReply !== undefined) {
        if (typeof adminReply !== "string" || adminReply.length > 5000) {
            return res.status(400).json({ message: "Invalid reply" });
        }

        ticket.adminReply = adminReply.trim();
        ticket.repliedBy = getUserId(req);
        ticket.repliedAt = new Date();
    }

    if (status) {
        ticket.status = status;
        ticket.resolvedAt = ["Resolved", "Closed"].includes(status)
            ? new Date()
            : null;
    }

    await ticket.save();
    await ticket.populate("employee", "name email");
    await ticket.populate("repliedBy", "name email");

    return res.status(200).json({
        message: "Support ticket updated successfully",
        ticket,
    });
});

// EMPLOYEE: Close their own ticket
exports.closeSupportTicket = asyncHandler(async (req, res) => {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
    }

    if (
        ticket.employee.toString() !== String(getUserId(req))
    ) {
        return res.status(403).json({ message: "Access denied" });
    }

    if (ticket.status === "Resolved") {
        ticket.status = "Closed";
        ticket.resolvedAt = ticket.resolvedAt || new Date();
        await ticket.save();
    } else {
        return res.status(400).json({
            message: "Only resolved tickets can be closed by an employee",
        });
    }

    return res.status(200).json({
        message: "Ticket closed successfully",
        ticket,
    });
});

// ADMIN: Ticket summary statistics
exports.getSupportTicketStats = asyncHandler(async (req, res) => {
    const stats = await SupportTicket.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);

    const counts = {
        total: 0,
        Open: 0,
        "In Progress": 0,
        Resolved: 0,
        Closed: 0,
    };

    stats.forEach(({ _id, count }) => {
        counts[_id] = count;
        counts.total += count;
    });

    return res.status(200).json({ stats: counts });
});
