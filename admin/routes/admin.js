const express = require('express');
const router = express.Router();
const { login_validator, ValidatorResult } = require('../../validation/user.validator')
const { verifyAccessToken } = require('../../middleware/admin.middleware')
const {
  login,
  logout,
  getAllUsers,
  getAllPendingUsersList,
  userJoinedCampaigned
} = require('../controllers/admin.controller');
const authenticate = require('../../middleware/authenticate');





router.post('/login', login_validator, ValidatorResult, login)
router.get('/logout', authenticate, logout)
router.get('/getAllUsers', authenticate, getAllUsers)
router.get('/pendingUserList', authenticate, getAllPendingUsersList);
router.put('/userJoinedCampaigned', authenticate, userJoinedCampaigned)




module.exports = router;


