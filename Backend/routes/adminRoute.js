const express=require("express")
const leadRoutes = require("./leadRoute")

const adminRoute=express.Router()

adminRoute.use("/leads", leadRoutes)

module.exports=adminRoute