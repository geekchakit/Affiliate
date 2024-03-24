const express = require('express');
const router = express.Router();
const { login_validator, ValidatorResult } = require('../../validation/user.validator')
const { verifyAccessToken } = require('../../middleware/admin.middleware')
const {
  login,
  logout,
  getAllUsers
} = require('../controllers/admin.controller');
const authenticate = require('../../middleware/authenticate');
const { AllExcelData } = require('../../v1/controllers/user.controller');


router.post('/login', login_validator, ValidatorResult, login)
router.get('/logout', authenticate, logout)
router.get('/getAllUsers' , authenticate , getAllUsers)


module.exports = router;


