
const express = require('express');
const { addNewCampaign, getAllCampaignsList, isFavouriteCampaign, addCategory, updateCampaign, deleteCampaign, uploadImage, getCampaign, getAllCampaignsRequestList, updateCampaignRequest, requestToJoinCampaign, getRequestedUserList, updateRequestToJoinCampaign, getCampaignForUser, adduserToCampaignViaAdmin, addSpecialCategory, getSpecialCategory } = require('../controllers/campaign.controller');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const upload = require('../../middleware/multer')



router.post('/addNewCampaign', authenticate, addNewCampaign)
router.get('/getAllCampaigns', getAllCampaignsList)
router.put('/favouiteCampaigns/:campaignId', authenticate, isFavouriteCampaign)
router.put('/updateCampaign/:campaignId', authenticate, updateCampaign)
router.delete('/deleteCampaign/:campaignId', authenticate, deleteCampaign)
router.post('/uploadImage', upload.single('image'), authenticate, uploadImage)
router.get('/getCampaign/:campaignId', authenticate, getCampaign);
router.get('/getAllCampaignsRequestList', authenticate,getAllCampaignsRequestList);
router.post('/updateCampaignRequest', authenticate, updateCampaignRequest);
router.post('/requestToJoinCampaign', authenticate,requestToJoinCampaign);
router.post('/getRequestedUserList', authenticate,getRequestedUserList);
router.post('/updateRequestToJoinCampaign', authenticate,updateRequestToJoinCampaign);
router.post('/getCampaignForUser', authenticate,getCampaignForUser);
router.post('/adduserToCampaignViaAdmin',authenticate ,adduserToCampaignViaAdmin);
router.post('/addSpecialCategory', authenticate,addSpecialCategory);
router.get('/getSpecialCategory/:campignId',authenticate,getSpecialCategory);
router.post('/addCategory', authenticate,addCategory);


module.exports = router;