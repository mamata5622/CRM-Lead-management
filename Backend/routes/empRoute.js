const express=require("express")
const supportRoute = require("./supportRoute")
const { isLoginUser } = require("../middleware/authMiddleware")
const { getEmployeeProfile, updateEmployeeProfile } = require("../controllers/employeeController")

const empRoute=express.Router()
empRoute.use("/support-tickets",supportRoute)

empRoute.get("/profile",isLoginUser,getEmployeeProfile)
empRoute.put("/profile",isLoginUser,updateEmployeeProfile)

module.exports=empRoute