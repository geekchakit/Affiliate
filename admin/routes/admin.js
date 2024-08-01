const express = require('express');
const router = express.Router();
const { login_validator, ValidatorResult } = require('../../validation/user.validator')
const { verifyAccessToken } = require('../../middleware/admin.middleware')
const {
  getAllUsers,
  getAllPendingUsersList,
  userJoinedCampaigned,
  getAdminDetail,
  updateAdminProfile,
  addAdminUser,
  addRolePermissions,
  removeRolePermissions,
  hasRolePermission,
  getAdmins,
  updateRolePermissions
} = require('../controllers/admin.controller');
const authenticate = require('../../middleware/authenticate');

const { middleware, loginAdmin,logout } = require("../../auth/authenticate");


router.get('/middleware', middleware);
router.post('/login', loginAdmin);
router.get('/logout', logout);
router.get('/getAllUsers', getAllUsers)
router.get('/pendingUserList', getAllPendingUsersList);
router.put('/userJoinedCampaigned', userJoinedCampaigned);
router.get('/getAdminDetail/:userid',getAdminDetail);
router.put('/updateAdminProfile/:userId',updateAdminProfile);
router.post('/addAdminUser',addAdminUser);
router.post('/addRolePermission',addRolePermissions);
router.post('/removeRolePermission',removeRolePermissions);
router.post('/hasRolePermission',hasRolePermission);
router.get('/getAdmins',getAdmins);
router.post('/updateRolePermissions', updateRolePermissions);

module.exports = router;


