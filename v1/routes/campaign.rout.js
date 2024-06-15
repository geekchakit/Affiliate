
const express = require('express');
const { addNewCampaign, getAllCampaignsList, isFavouriteCampaign, addCategory, updateCampaign, deleteCampaign, uploadImage, getCampaign, getAllCampaignsRequestList, updateCampaignRequest, requestToJoinCampaign, getRequestedUserList, updateRequestToJoinCampaign, getCampaignForUser, adduserToCampaignViaAdmin, addSpecialCategory, getSpecialCategory } = require('../controllers/campaign.controller');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const upload = require('../../middleware/multer')



router.post('/addNewCampaign', addNewCampaign)
router.get('/getAllCampaigns', getAllCampaignsList)
router.put('/favouiteCampaigns/:campaignId', isFavouriteCampaign)
router.put('/updateCampaign/:campaignId', updateCampaign)
router.delete('/deleteCampaign/:campaignId', deleteCampaign)
router.post('/uploadImage', upload.single('image'), uploadImage)
router.get('/getCampaign/:campaignId', getCampaign);
router.get('/getAllCampaignsRequestList',getAllCampaignsRequestList);
router.post('/updateCampaignRequest', updateCampaignRequest);
router.post('/requestToJoinCampaign',requestToJoinCampaign);
router.post('/getRequestedUserList',getRequestedUserList);
router.post('/updateRequestToJoinCampaign',updateRequestToJoinCampaign);
router.post('/getCampaignForUser',getCampaignForUser);
router.post('/adduserToCampaignViaAdmin' ,adduserToCampaignViaAdmin);
router.post('/addSpecialCategory',addSpecialCategory);
router.get('/getSpecialCategory/:campignId',getSpecialCategory);
router.post('/addCategory',addCategory);


module.exports = router;