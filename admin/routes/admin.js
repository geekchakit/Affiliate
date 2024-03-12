const express = require('express');
const router = express.Router();
const { login_validator, ValidatorResult } = require('../../validation/user.validator')
const { verifyAccessToken } = require('../../middleware/admin.middleware')
const {
  login,
  logout,
  getAllUsers
} = require('../controllers/admin.controller')


router.post('/login', login_validator, ValidatorResult, login)
router.get('/logout', verifyAccessToken, logout)
router.get('/getAllUsers' , verifyAccessToken , getAllUsers)



module.exports = router;


