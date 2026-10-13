const express=require("express")
const authRoute = require("./authRoutes")
const adminRoute = require("./adminRoute")
const empRoute = require("./empRoute")

const allRoutes=express.Router()

allRoutes.use("/auth",authRoute)
allRoutes.use("/admin",adminRoute)
allRoutes.use("/emp",empRoute)

module.exports=allRoutes