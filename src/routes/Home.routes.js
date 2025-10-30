
const express=require('express')
const { homeInfo } = require("../controllers/Home.controller")
const authMiddleware = require('../middleware/auth.middleware')

const router=express.Router()



router.get('/',authMiddleware,  homeInfo)

module.exports=router