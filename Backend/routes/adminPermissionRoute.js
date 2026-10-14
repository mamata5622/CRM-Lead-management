
const express = require("express");

const {
    listEmployees,
    updateEmployeePermission,
} = require("../controllers/adminpermissionController");

const {
    isLoginUser,
    isAdmin,
} = require("../middleware/authMiddleware");

const permissionRoute = express.Router();



// Get all employees and their permissions
permissionRoute.get("/employees", isLoginUser, isAdmin, listEmployees);

// Update one permission for an employee
permissionRoute.patch(
    "/employees/:employeeId", isLoginUser, isAdmin,
    updateEmployeePermission
);

module.exports = permissionRoute;
