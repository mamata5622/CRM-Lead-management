const express=require("express")
const { createSupportTicket, getSupportTickets, closeSupportTicket, getSupportTicketStats, replyToSupportTicket } = require("../controllers/supportTicketController")
const { isLoginUser, isEmployee, isAdmin } = require("../middleware/authMiddleware")

const supportRoute=express.Router()

supportRoute.post("/",isLoginUser,isEmployee, createSupportTicket)
supportRoute.get("/",isLoginUser,isEmployee, getSupportTickets)
supportRoute.patch("/:id/close",isLoginUser,isEmployee, closeSupportTicket)


supportRoute.get("/stats",isLoginUser,isAdmin, getSupportTicketStats)
supportRoute.patch("/:id/reply",isLoginUser,isAdmin,replyToSupportTicket)

module.exports=supportRoute