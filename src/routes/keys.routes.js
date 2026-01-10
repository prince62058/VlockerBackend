
const express=require('express')
const { requestKeys, updateStatus, userkeyHistory, allKeys } = require('../controllers/Keys.controller')
const authMiddleware = require('../middleware/auth.middleware')
const routes=express.Router()

routes.post('/',authMiddleware,requestKeys)
routes.patch('/:keyId',authMiddleware,updateStatus)
routes.get('/',authMiddleware,userkeyHistory)
routes.get('/allKeys',authMiddleware,allKeys)

module.exports=routes