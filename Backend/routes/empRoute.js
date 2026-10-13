const express=require("express")
const supportRoute = require("./supportRoute")

const empRoute=express.Router()
empRoute.use("/support-tickets",supportRoute)

module.exports=empRoute