
const mongoose = require("mongoose");
const User = require("../models/userModel");

const ALLOWED_PERMISSIONS = {
  leads: ["view", "create", "edit", "updateStatus", "delete"],
  followUps: ["view", "create", "edit", "complete", "delete"],
  pipeline: ["view", "create", "edit", "delete"],
  callLogs: ["view", "create", "edit", "delete"],
  communications: ["view", "create", "edit", "delete"],
};

const normalizePermissions = (permissions = {}) => {
  const result = {};

  for (const [module, actions] of Object.entries(ALLOWED_PERMISSIONS)) {
    result[module] = {};

    for (const action of actions) {
      result[module][action] =
        permissions?.[module]?.[action] === true;
    }
  }

  return result;
};

// GET /api/admin/permissions/employees
const listEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      role: { $ne: "admin" },
    })
      .select("name email phone role isActive permissions createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: employees.length,
      employees: employees.map((employee) => ({
        ...employee,
        permissions: normalizePermissions(employee.permissions),
      })),
    });
  } catch (error) {
    console.error("List employees error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load employees.",
    });
  }
};

// PATCH /api/admin/permissions/employees/:employeeId
const updateEmployeePermission = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { module, action, enabled } = req.body;

    if (!mongoose.isValidObjectId(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });
    }

    if (!Object.prototype.hasOwnProperty.call(ALLOWED_PERMISSIONS, module)) {
      return res.status(400).json({
        success: false,
        message: "Invalid permission module.",
      });
    }

    if (!ALLOWED_PERMISSIONS[module].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid permission action.",
      });
    }

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "enabled must be true or false.",
      });
    }

    const adminId = String(
      req.adminUser?._id || req.user?._id || req.user?.id || ""
    );

    if (adminId === employeeId) {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own permissions here.",
      });
    }

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    if (String(employee.role).toLowerCase() === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin permissions cannot be changed here.",
      });
    }

    if (employee.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Cannot change permissions for an inactive employee.",
      });
    }

    // Update only the selected nested permission.
    employee.set(`permissions.${module}.${action}`, enabled);
    await employee.save();

    const savedEmployee = await User.findById(employeeId)
      .select("name email phone role isActive permissions")
      .lean();

    return res.status(200).json({
      success: true,
      message: enabled
        ? `${module} ${action} permission granted.`
        : `${module} ${action} permission revoked.`,
      employee: {
        ...savedEmployee,
        permissions: normalizePermissions(savedEmployee.permissions),
      },
    });
  } catch (error) {
    console.error("Update employee permission error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update permissions.",
    });
  }
};

module.exports = {
  listEmployees,
  updateEmployeePermission,
};
