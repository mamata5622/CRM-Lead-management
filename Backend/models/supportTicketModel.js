
const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
    {
        ticketNumber: {
            type: String,
            unique: true,
            index: true,
        },

        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        subject: {
            type: String,
            required: [true, "Subject is required"],
            trim: true,
            maxlength: 200,
        },

        category: {
            type: String,
            required: true,
            enum: [
                "Technical Issue",
                "Account Access",
                "CRM / Leads",
                "Follow-ups",
                "HR / Attendance",
                "Other",
            ],
            default: "Other",
        },

        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Urgent"],
            default: "Medium",
        },

        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            maxlength: 5000,
        },

        status: {
            type: String,
            enum: ["Open", "In Progress", "Resolved", "Closed"],
            default: "Open",
            index: true,
        },

        adminReply: {
            type: String,
            default: "",
            trim: true,
            maxlength: 5000,
        },

        repliedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        repliedAt: {
            type: Date,
            default: null,
        },

        resolvedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

supportTicketSchema.pre("validate", async function () {
    if (!this.ticketNumber && this.isNew) {
        this.ticketNumber = `SUP-${new Date().getFullYear()}-${new mongoose.Types.ObjectId()
            .toString()
            .slice(-8)
            .toUpperCase()}`;
    }
});

supportTicketSchema.index({ employee: 1, createdAt: -1 });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
