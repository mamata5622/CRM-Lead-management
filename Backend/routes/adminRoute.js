const express=require("express")
const leadRoutes = require("./leadRoute")
const followupRoute = require("./followUpRoute")
const adminUserRoute = require("./adminUserRoute")
const adminSettingsRoute = require("./settingsRoute")
const permissionRoute = require("./adminPermissionRoute")

const adminRoute=express.Router()

adminRoute.use("/leads", leadRoutes);
adminRoute.use("/follow-ups",followupRoute);
adminRoute.use("/users",adminUserRoute);
adminRoute.use("/settings",adminSettingsRoute)
adminRoute.use("/permission",permissionRoute)

module.exports=adminRoute