const express=require("express")
const authRoute = require("./authRoutes")
const adminRoute = require("./adminRoute")

const allRoutes=express.Router()

allRoutes.use("/auth",authRoute)
allRoutes.use("/admin",adminRoute)

module.exports=allRoutes