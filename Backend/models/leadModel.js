const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      required: true,
    },

    name: {
      type: String,
      required: [true, "Lead name is required"],
      trim: true,
    },

    company: {
      type: String,
      default: "",
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    vertical: {
      type: String,
      default: "Real Estate",
      trim: true,
    },

    source: {
      type: String,
      default: "Website",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Qualified",
        "Proposal",
        "Negotiation",
        "Won",
        "Lost",
      ],
      default: "New",
    },

    value: {
      type: Number,
      default: 0,
      min: 0,
    },

    followUp: {
      type: Date,
      default: null,
    },

    owner: {
      type: String,
      default: "Unassigned",
      trim: true,
    },

    initials: {
      type: String,
      default: "",
    },

    overdue: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

leadSchema.pre("validate", function () {
  if (this.name && !this.initials) {
    this.initials = this.name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  // Support the frontend label without violating the schema enum.
  if (this.status === "Proposal Sent") {
    this.status = "Proposal";
  }
});

module.exports = mongoose.model("Lead", leadSchema);