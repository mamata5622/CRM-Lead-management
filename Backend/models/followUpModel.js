const mongoose = require("mongoose");

const CHANNELS = [
    "LinkedIn",
    "Facebook",
    "WhatsApp",
    "Email",
    "Phone Call",
    "Website Inquiry",
    "Instagram",
    "Other",
];

const noteSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

const communicationSchema = new mongoose.Schema(
    {
        channel: {
            type: String,
            enum: CHANNELS,
            required: true,
        },
        direction: {
            type: String,
            enum: ["Incoming", "Outgoing", "Internal"],
            default: "Outgoing",
        },
        subject: {
            type: String,
            trim: true,
            default: "",
        },
        message: {
            type: String,
            trim: true,
            required: true,
            maxlength: 5000,
        },
        outcome: {
            type: String,
            trim: true,
            default: "",
        },
        communicatedAt: {
            type: Date,
            default: Date.now,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        externalId: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

const followUpSchema = new mongoose.Schema(
    {
        lead: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lead",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        description: {
            type: String,
            trim: true,
            default: "",
            maxlength: 2000,
        },
        channel: {
            type: String,
            enum: CHANNELS,
            required: true,
        },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Urgent"],
            default: "Medium",
        },
        status: {
            type: String,
            enum: ["Pending", "In Progress", "Completed", "Cancelled"],
            default: "Pending",
        },
        dueDate: {
            type: Date,
            default: null,
        },
        reminderAt: {
            type: Date,
            default: null,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        notes: [noteSchema],
        communications: [communicationSchema],
        completedAt: {
            type: Date,
            default: null,
        },
        completionOutcome: {
            type: String,
            trim: true,
            default: "",
        },
        isArchived: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true }
);

followUpSchema.index({ lead: 1, createdAt: -1 });
followUpSchema.index({ channel: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model("FollowUp", followUpSchema);
module.exports.CHANNELS = CHANNELS;