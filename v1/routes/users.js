const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const { user_validator, login_validator, ValidatorResult } = require('../../validation/user.validator')
const {
  signUp,
  login,
  logout,
  verifyOtp,
  uploadUserData,
  AllExcelData,
} = require('../controllers/user.controller');
const upload = require('../../middleware/excelUpload')


router.post('/signUp', signUp)
router.post('/login', login_validator, ValidatorResult, login)
router.get('/logout', authenticate, logout)
router.post('/verifyOtp', authenticate, verifyOtp);
router.post('/uploadExcelFile', upload.single('file'), authenticate, uploadUserData)
router.post('/data' , AllExcelData)


module.exports = router;
