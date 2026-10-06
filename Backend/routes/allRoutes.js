const express=require("express")
const leadRoutes = require("./leadRoute")

const allRoutes=express.Router()
allRoutes.use("/leads",leadRoutes)

module.exports=allRoutes