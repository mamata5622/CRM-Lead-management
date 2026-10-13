const express=require("express")
const { getAdminSettings, updateAdminSettings, updateAdminPassword } = require("../controllers/adminSettingsController");
const { isLoginUser, isAdmin } = require("../middleware/authMiddleware");

const adminSettingsRoute=express.Router()

adminSettingsRoute.get("/profile",isLoginUser,isAdmin, getAdminSettings);
adminSettingsRoute.patch("/profile",isLoginUser,isAdmin,updateAdminSettings);
adminSettingsRoute.patch("/password",isLoginUser,isAdmin,updateAdminPassword)

module.exports=adminSettingsRoute