const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const { user_validator, login_validator, ValidatorResult } = require('../../validation/user.validator')
const {
  signUp,
  login,
  logout,
  uploadUserData,
  AllExcelData,
  update_document,
  account_verify,
  get_profile,
  update_profile,
  delete_profile,
} = require('../controllers/user.controller');
const upload = require('../../middleware/excelUpload')





router.post('/signUp', signUp)
router.post('/login', login_validator, ValidatorResult, login)
router.get('/logout', authenticate, logout);
router.put('/updateDocument/:userId', update_document);
router.put('/accountVerify/:userId', authenticate, account_verify);
router.get('/getProfile', get_profile);
router.put('/updateProfile' , authenticate , update_profile);
router.delete('/deleteProfile/:userId' , authenticate , delete_profile)
router.post('/uploadExcelFile', upload.single('file'), authenticate, uploadUserData)
router.post('/data', AllExcelData)




module.exports = router;
