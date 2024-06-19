const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const { user_validator, login_validator, ValidatorResult } = require('../../validation/user.validator')
const {
  signUp,
  // login,
  // logout,
  uploadUserData,
  AllExcelData,
  update_document,
  account_verify,
  get_profile,
  update_profile,
  delete_profile,
  getExcelHeaders,
  calculateUserRevenue,
  saveExcelData,
  getExcelDataForAdmin,
  getExcelDataForUser,
  addUserViaAdmin,
  getCategory,
  addCategory,
  getTotalRevenueAndCommissionForUser,
  getUserUnderReferral,
  getTotalRevenueAndCommissionForUserSpecific,
  saveFinalExcelData,
  forgetPassword,
  resetPassword
} = require('../controllers/user.controller');
const upload = require('../../middleware/excelUpload')

const {login,logout} = require("../../auth/authenticate");




router.post('/signUp', signUp)
router.post('/login', login)
router.get('/logout', logout);
router.put('/updateDocument/:userId', update_document);
router.put('/accountVerify/:userId', account_verify);
router.get('/getProfile/:userId', get_profile);
router.put('/updateProfile/:userId', update_profile);
router.delete('/deleteProfile/:userId', delete_profile)
router.post('/uploadExcelFile', upload.single('file'), uploadUserData)
router.post('/getAllExcelData',AllExcelData)
router.get('/getExcelHeaders',getExcelHeaders);
router.post('/calculateUserRevenue',calculateUserRevenue);
router.post('/saveExcelData',upload.single('file'),saveExcelData);
router.post('/getExcelDataForAdmin', getExcelDataForAdmin);
router.post('/getExcelDataForUser',getExcelDataForUser);
router.post('/addUserViaAdmin',addUserViaAdmin);
router.get('/getCategory/:campignId',getCategory);
router.post('/addCategory',addCategory);
router.post('/getTotalRevenueAndCommissionForUser',getTotalRevenueAndCommissionForUser);
router.get('/getUserUnderReferral/:referralCode',getUserUnderReferral);
router.post('/getTotalRevenueAndCommissionForUserSpecific',getTotalRevenueAndCommissionForUserSpecific);
router.post('/saveFinalExcelData',upload.single('file'),saveFinalExcelData);
router.post('/forgetPassword',forgetPassword);
router.post('/resetPassword',resetPassword);

module.exports = router;
