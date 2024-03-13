const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const { user_validator, login_validator, ValidatorResult } = require('../../validation/user.validator')
const {
  signUp,
  login,
  logout,
  verifyOtp,
} = require('../controllers/user.controller')


router.post('/signUp',  signUp)
router.post('/login', login_validator, ValidatorResult, login)
router.get('/logout', authenticate, logout)
router.post('/verifyOtp' , authenticate , verifyOtp)



module.exports = router;
