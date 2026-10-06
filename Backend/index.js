const express=require("express")
const connectDB=require("./config/db")
const allRoutes = require("./routes/allRoutes")
require("dotenv").config()
const cors = require("cors");

connectDB()
const myServer=express()
myServer.use(express.json())

myServer.use(cors({origin:"*"}))
myServer.use("/api",allRoutes)

myServer.use("/run",(req,res)=>{
    res.send("hello")
})
const port=process.env.PORT
myServer.listen(port,()=>{
    console.log("my server is running",port)
});