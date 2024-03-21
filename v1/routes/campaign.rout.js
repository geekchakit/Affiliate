
const express = require('express');
const { addNewCampaign, getAllCampaignsList } = require('../controllers/campaign.controller');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const verifyAccessToken  = require('../../middleware/admin.middleware')



router.post('/addNewCampaign', authenticate, addNewCampaign)
router.get('/getAllCampaigns' , getAllCampaignsList)




module.exports = router;