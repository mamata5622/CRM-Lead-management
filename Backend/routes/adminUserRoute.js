const express=require("express")
const { getAllUsers, getAllEmployees, assignWork, getWorkAssignments, updateWorkStatus, updateUserRole, makeUserEmployee } = require("../controllers/adminUserController")

const adminUserRoute=express.Router()

adminUserRoute.get("/",getAllUsers)
adminUserRoute.get("/employees",getAllEmployees)
adminUserRoute.post("/assign-work",assignWork)
adminUserRoute.get("/work-assignments",getWorkAssignments)
adminUserRoute.patch("/work-assignments/:assignmentId/status",updateWorkStatus)
adminUserRoute.patch("/:id/role",updateUserRole)
adminUserRoute.post("/:id/promote",makeUserEmployee)

module.exports=adminUserRoute