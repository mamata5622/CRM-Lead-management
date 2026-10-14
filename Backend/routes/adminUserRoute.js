const express = require("express")
const { getAllUsers, getAllEmployees, assignWork, getWorkAssignments, updateWorkStatus, updateUserRole, makeUserEmployee } = require("../controllers/adminUserController")
const { isLoginUser, isAdmin } = require("../middleware/authMiddleware")

const adminUserRoute = express.Router()

adminUserRoute.get("/", isLoginUser, isAdmin, getAllUsers)
adminUserRoute.get("/employees", isLoginUser, isAdmin, getAllEmployees)
adminUserRoute.post("/assign-work", isLoginUser, isAdmin, assignWork)
adminUserRoute.get("/work-assignments", isLoginUser, isAdmin, getWorkAssignments)
adminUserRoute.patch("/work-assignments/:assignmentId/status", isLoginUser, isAdmin, updateWorkStatus)
adminUserRoute.patch("/:id/role", isLoginUser, isAdmin, updateUserRole)
adminUserRoute.post("/:id/promote", isLoginUser, isAdmin, makeUserEmployee)

module.exports = adminUserRoute