
const mongoose = require("mongoose");
const User = require("../models/userModel");
const WorkAssignment = require("../models/workAssignmentModel");

const ALLOWED_ROLES = ["user", "employee"];
const ALLOWED_FILTER_ROLES = ["user", "employee", "admin"];
const ALLOWED_PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const ALLOWED_STATUSES = [
  "Pending",
  "In Progress",
  "Completed",
  "Cancelled",
];

const USER_FIELDS =
  "name email phone role isActive profileImage createdAt";

// Escape regex input so search text is treated literally.
const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAdminId = (req) =>
  req.user?.id || req.user?._id;

const isValidId = (id) => mongoose.isValidObjectId(id);

const getPagination = (page, limit) => {
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(limit) || 10)
  );

  return {
    currentPage,
    pageSize,
    skip: (currentPage - 1) * pageSize,
  };
};

const sendError = (res, status, message) =>
  res.status(status).json({
    success: false,
    message,
  });

// GET /api/admin/users
// Fetch all users, with search, role filter and pagination.
exports.getAllUsers = async (req, res, next) => {
  try {
    const {
      search = "",
      role = "",
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (role) {
      if (!ALLOWED_FILTER_ROLES.includes(role)) {
        return sendError(res, 400, "Invalid role filter.");
      }

      filter.role = role;
    }

    if (typeof search !== "string") {
      return sendError(res, 400, "Search must be text.");
    }

    if (search.trim()) {
      const searchRegex = new RegExp(
        escapeRegex(search.trim()),
        "i"
      );

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const { currentPage, pageSize, skip } =
      getPagination(page, limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(USER_FIELDS)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),

      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/employees
// Fetch all employees, with optional search and pagination.
exports.getAllEmployees = async (req, res, next) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 100,
    } = req.query;

    if (typeof search !== "string") {
      return sendError(res, 400, "Search must be text.");
    }

    const filter = { role: "employee" };

    if (search.trim()) {
      const searchRegex = new RegExp(
        escapeRegex(search.trim()),
        "i"
      );

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const { currentPage, pageSize, skip } =
      getPagination(page, limit);

    const [employees, total] = await Promise.all([
      User.find(filter)
        .select(USER_FIELDS)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),

      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      employees,
      pagination: {
        total,
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/role
// Change a regular user's role between user and employee.
exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid user ID.");
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return sendError(
        res,
        400,
        "Only user and employee roles can be assigned."
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return sendError(res, 404, "User not found.");
    }

    if (user.role === "admin") {
      return sendError(
        res,
        403,
        "Admin accounts cannot be changed here."
      );
    }

    if (user.role === role) {
      return res.status(200).json({
        success: true,
        message: `User already has the ${role} role.`,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Role updated to ${role} successfully.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/users/:id/promote
// Promote a regular user to employee.
exports.makeUserEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid user ID.");
    }

    const user = await User.findById(id);

    if (!user) {
      return sendError(res, 404, "User not found.");
    }

    if (user.role === "admin") {
      return sendError(
        res,
        403,
        "Admin accounts cannot be promoted here."
      );
    }

    if (user.role === "employee") {
      return res.status(200).json({
        success: true,
        message: "This user is already an employee.",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    user.role = "employee";
    await user.save();

    return res.status(200).json({
      success: true,
      message: `${user.name} is now an employee.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/users/assign-work
// Assign a work item to an active employee.
exports.assignWork = async (req, res, next) => {
  try {
    const {
      employeeId,
      title,
      description = "",
      priority = "Medium",
      dueDate,
    } = req.body;

    if (
      !employeeId ||
      typeof title !== "string" ||
      !title.trim() ||
      !dueDate
    ) {
      return sendError(
        res,
        400,
        "Employee, title and due date are required."
      );
    }

    if (!isValidId(employeeId)) {
      return sendError(res, 400, "Invalid employee ID.");
    }

    if (
      typeof description !== "string" ||
      description.length > 5000
    ) {
      return sendError(
        res,
        400,
        "Description must be text with at most 5000 characters."
      );
    }

    if (!ALLOWED_PRIORITIES.includes(priority)) {
      return sendError(res, 400, "Invalid work priority.");
    }

    const parsedDueDate = new Date(dueDate);

    if (Number.isNaN(parsedDueDate.getTime())) {
      return sendError(res, 400, "Invalid due date.");
    }

    const adminId = getAdminId(req);

    if (!adminId || !isValidId(adminId)) {
      return sendError(
        res,
        401,
        "Unable to identify the logged-in admin."
      );
    }

    const employee = await User.findOne({
      _id: employeeId,
      role: "employee",
      isActive: true,
    }).select("_id");

    if (!employee) {
      return sendError(
        res,
        404,
        "Active employee not found. Promote the user first."
      );
    }

    const assignment = await WorkAssignment.create({
      employee: employee._id,
      assignedBy: adminId,
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: parsedDueDate,
      status: "Pending",
    });

    const populatedAssignment =
      await WorkAssignment.findById(assignment._id)
        .populate("employee", "name email phone role")
        .populate("assignedBy", "name email");

    return res.status(201).json({
      success: true,
      message: "Work assigned successfully.",
      assignment: populatedAssignment,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/work-assignments
// Fetch assignments with optional employee/status filters.
exports.getWorkAssignments = async (req, res, next) => {
  try {
    const {
      employeeId,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (employeeId) {
      if (!isValidId(employeeId)) {
        return sendError(res, 400, "Invalid employee ID.");
      }

      filter.employee = employeeId;
    }

    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return sendError(
          res,
          400,
          "Invalid assignment status."
        );
      }

      filter.status = status;
    }

    const { currentPage, pageSize, skip } =
      getPagination(page, limit);

    const [assignments, total] = await Promise.all([
      WorkAssignment.find(filter)
        .populate("employee", "name email phone role")
        .populate("assignedBy", "name email")
        .sort({ dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),

      WorkAssignment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      assignments,
      pagination: {
        total,
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/work-assignments/:assignmentId/status
// Update status and track completion time.
exports.updateWorkStatus = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { status } = req.body;

    if (!isValidId(assignmentId)) {
      return sendError(res, 400, "Invalid assignment ID.");
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return sendError(
        res,
        400,
        "Invalid assignment status."
      );
    }

    const update = {
      status,
      completedAt:
        status === "Completed" ? new Date() : null,
    };

    const assignment = await WorkAssignment.findByIdAndUpdate(
      assignmentId,
      { $set: update },
      { new: true, runValidators: true }
    )
      .populate("employee", "name email phone role")
      .populate("assignedBy", "name email");

    if (!assignment) {
      return sendError(
        res,
        404,
        "Work assignment not found."
      );
    }

    return res.status(200).json({
      success: true,
      message: "Work status updated successfully.",
      assignment,
    });
  } catch (error) {
    next(error);
  }
};
