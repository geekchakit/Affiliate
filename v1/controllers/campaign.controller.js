
const {
    sendResponse
} = require('../../services/common.service')
const dateFormat = require('../../helper/dateformat.helper');
const User = require('../../models/user.model')
const {
    saveCampaign,
} = require('../services/campaign.service');
const Keys = require('../../keys/keys')
const constants = require('../../config/constants')
const { addCampaignResponse } = require('../../ResponseData/campaign.reponse');
const Campaign = require('../../models/campaign.model');
const { BASEURL } = require('../../keys/development.keys')
const JoinedCampaign = require('../../models/joinedCampaign.model')






exports.addNewCampaign = async (req, res, next) => {

    try {

        const reqBody = req.body
        const userId = req.user._id;
        const users = await User.findById(userId);

        if (!users || users.user_type !== constants.USER_TYPE.ADMIN)
            return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'USER.invalid_user', {}, req.headers.lang);

        const existCampaignName = await Campaign.findOne({ campaignName: reqBody.campaignName });

        if (existCampaignName)
            return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'CAMPAIGN.already_existing_campaigns', {}, req.headers.lang);

        reqBody.created_at = await dateFormat.set_current_timestamp();
        reqBody.updated_at = await dateFormat.set_current_timestamp();

        const campaign = await saveCampaign(reqBody);
        const campaginResponse = addCampaignResponse(campaign)

        return sendResponse(res, constants.WEB_STATUS_CODE.CREATED, constants.STATUS_CODE.SUCCESS, 'CAMPAIGN.addNewCampaign', campaginResponse, req.headers.lang);

    } catch (err) {
        console.log("err(addNewCampaign)......", err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}



exports.getAllCampaignsList = async (req, res) => {

    try {

        const { campaignName, isFavourite } = req.query;
        const query = {};

        if (campaignName) {
            const campaignNameRegex = new RegExp(campaignName, 'i');
            query.$or = [
                { campaignName: campaignNameRegex },
                { email: campaignNameRegex }
            ];
        }

        if (isFavourite) {
            query.isFavourite = isFavourite;
        }

        const [campaigns, totalCampaigns] = await Promise.all([
            Campaign.find(query)
                .select('_id campaignName status countryName CampaignImage commissionName paymentTerm conversionRate confirmationRate isFavourite')
                .populate('userId', '_id full_name email mobile_number')
                .sort({ createdAt: -1 }),
            Campaign.countDocuments(query)
        ]);

        if (!campaigns || campaigns.length === 0) {
            return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'CAMPAIGN.not_found', [], req.headers.lang);
        }

        const campaignNameCounts = {};
        const userIdSet = new Set();

        campaigns.forEach(campaign => {
            const { campaignName} = campaign;
            if (!campaignNameCounts[campaignName]) {
                campaignNameCounts[campaignName] = 0;
            }
            campaignNameCounts[campaignName]++;
        });

        const data = {
            totalCampaigns: totalCampaigns,
            campaignNameCounts: campaignNameCounts,
            campaigns: campaigns
        };

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'CAMPAIGN.getAllCampaigns', data, req.headers.lang);
    } catch (err) {
        console.error('Error(getAllCampaignsList)....', err);
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang);
    }
};



exports.isFavouriteCampaign = async (req, res) => {

    try {

        const { campaignId } = req.params;
        const userId = req.user._id;
        const users = await User.findById(userId);

        if (!users || users.user_type !== constants.USER_TYPE.USER)
            return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'USER.invalid_user', {}, req.headers.lang);

        const campaign = await Campaign.findById(campaignId);

        if (!campaign)
            return sendResponse(res, constants.WEB_STATUS_CODE.NOT_FOUND, constants.STATUS_CODE.FAIL, 'CAMPAIGN.not_found', {}, req.headers.lang);
        campaign.isFavourite = true;
        campaign.updated_at = dateFormat.set_current_timestamp();

        await campaign.save();
        campaign.userId = undefined;
        campaign.deleted_at = undefined;

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'CAMPAIGN.faviorite_campaigns', campaign, req.headers.lang);

    } catch (err) {
        console.error('Error(isFavouriteCampaign)....', err);
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang);
    }
}



exports.updateCampaign = async (req, res) => {

    try {

        const { campaignId } = req.params;
        const userId = req.user._id;
        const reqBody = req.body;
        const users = await User.findById(userId);

        if (!users || (users.user_type !== constants.USER_TYPE.ADMIN))
            return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'USER.invalid_user', {}, req.headers.lang);

        const campaign = await Campaign.findById(campaignId);

        if (!campaign)
            return sendResponse(res, constants.WEB_STATUS_CODE.NOT_FOUND, constants.STATUS_CODE.FAIL, 'CAMPAIGN.not_found', {}, req.headers.lang);

        campaign.campaignName = reqBody.campaignName || campaign.campaignName;
        campaign.status = reqBody.status || campaign.status;
        campaign.countryName = reqBody.countryName || campaign.countryName;
        campaign.paymentTerm = reqBody.paymentTerm || campaign.paymentTerm
        campaign.conversionRate = reqBody.conversionRate || campaign.conversionRate;
        campaign.confirmationRate = reqBody.confirmationRate || campaign.confirmationRate;
        campaign.commissionName = reqBody.commissionName || campaign.commissionName;
        campaign.updated_at = dateFormat.set_current_timestamp();

        await campaign.save();

        campaign.userId = undefined;
        campaign.deleted_at = undefined;

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'CAMPAIGN.update_campaign', campaign, req.headers.lang);

    } catch (err) {
        console.error('Error(updateCampaign)....', err);
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang);
    }
}


exports.getCampaign = async (req, res) => {

    try {

        const { campaignId } = req.params;
        const userId = req.user._id;
        const users = await User.findById(userId);

        if (!users || users.user_type !== constants.USER_TYPE.ADMIN)
            return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'USER.invalid_user', {}, req.headers.lang);

        const campaign = await Campaign.findById(campaignId);

        if (!campaign)
            return sendResponse(res, constants.WEB_STATUS_CODE.NOT_FOUND, constants.STATUS_CODE.FAIL, 'CAMPAIGN.not_found', {}, req.headers.lang);

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'CAMPAIGN.get_campaign', campaign, req.headers.lang);

    } catch (err) {
        console.error('Error(getCampaign)....', err);
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang);
    }
}



exports.deleteCampaign = async (req, res) => {

    try {

        const { campaignId } = req.params;
        const userId = req.user._id;
        const users = await User.findById(userId);

        if (!users || users.user_type !== constants.USER_TYPE.ADMIN)
            return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'USER.invalid_user', {}, req.headers.lang);

        const campaign = await Campaign.findByIdAndDelete(campaignId);

        if (!campaign)
            return sendResponse(res, constants.WEB_STATUS_CODE.NOT_FOUND, constants.STATUS_CODE.FAIL, 'CAMPAIGN.not_found', {}, req.headers.lang);

        campaign.userId = undefined;

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'CAMPAIGN.delete_campaign', campaign, req.headers.lang);

    } catch (err) {
        console.error('Error(deleteCampaign)....', err);
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang);
    }
}



exports.uploadImage = async (req, res) => {

    try {

        const { campaignId } = req.body;
        const userId = req.user._id;
        const users = await User.findById(userId);

        if (!users || users.user_type !== constants.USER_TYPE.ADMIN)
            return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'USER.invalid_user', {}, req.headers.lang);

        const campaign = await Campaign.findById(campaignId);

        if (!campaign)
            return sendResponse(res, constants.WEB_STATUS_CODE.NOT_FOUND, constants.STATUS_CODE.FAIL, 'CAMPAIGN.not_found', {}, req.headers.lang);

        const files = req.file;
        console.log("files", files);
        campaign.CampaignImage = `${BASEURL}/uploads/${files.filename}`;
        await campaign.save()

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'CAMPAIGN.delete_campaign', campaign, req.headers.lang);

    } catch (err) {
        console.error('Error(uploadImage)....', err);
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang);
    }
}




exports.getAllCampaignsRequestList = async (req, res) => {

    try {

        const userId = req.user._id;
        const { status, campaignRequest } = req.query;

        const user = await User.findById(userId);

        if (!user || ![constants.USER_TYPE.ADMIN, constants.USER_TYPE.USER].includes(user.user_type))
            return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'GENERAL.unauthorized_user', {}, req.headers.lang);

        const query = {};
        if (status) {
            query.status = status
        }

        if (campaignRequest) {
            const campaignRequestRegex = new RegExp(campaignRequest, 'i');
            query.$or = [
                { campaignRequest: campaignRequestRegex },
            ];
        }

        let campaigns;
        let totalCampaigns;
        if (Object.keys(query).length === 0) {
            campaigns = await Campaign.find()
                .select('_id campaignName status campaignRequest countryName commissionName CampaignImage paymentTerm conversionRate confirmationRate isFavourite')
                .populate('userId', '_id full_name email campaign')
                .sort()
                .lean();

            totalCampaigns = await Campaign.countDocuments();
        } else {
            campaigns = await Campaign.find(query)
                .select('_id campaignName status campaignRequest countryName CampaignImage commissionName paymentTerm conversionRate confirmationRate isFavourite')
                .populate('userId', '_id name email mobile_number')
                .sort()
                .lean();

            totalCampaigns = await Campaign.countDocuments(query);
        }

        const responseData = campaigns.map(data => ({
            totalCampaigns: totalCampaigns,
            CampaignName: data.campaignName,
            Status: data.status,
            countryName: data.countryName,
            commissionName: data.commissionName,
            paymentTerm: data.paymentTerm,
            ConversionRate: data.ConversionRate,
            confirmationRate: data.confirmationRate,
            CampaignImage: data.CampaignImage,
            campaignRequest: data.campaignRequest,
            conversionRate: data.conversionRate,
            isFavourite: data.isFavourite,
            created_at: data.created_at,
        })) || []

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'CAMPAIGN.campaign_request_list', responseData, req.headers.lang);

    } catch (err) {
        console.error('Error(getAllCampaignsRequestList)....', err);
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang);
    }
};




exports.updateCampaignRequest = async (req, res) => {

    try {

        const userId = req.user._id;
        const reqBody = req.body;
        const { campaignId } = reqBody
        const users = await User.findById(userId);

        if (!users || (users.user_type !== constants.USER_TYPE.USER))
            return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'USER.invalid_user', {}, req.headers.lang);

        reqBody.created_at = dateFormat.set_current_timestamp();
        reqBody.updated_at = dateFormat.set_current_timestamp();
        reqBody.campaignId = campaignId;
        reqBody.userId = userId;

        const campaign = await JoinedCampaign.create(reqBody);

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'CAMPAIGN.update_campaign_request', campaign, req.headers.lang);

    } catch (err) {
        console.error('Error(updateCampaignRequest)....', err);
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang);
    }
}

exports.requestToJoinCampaign = async (req, res) => {
    try{
       const {userId,campaignId} = req.body;
       const update_campaign = await Campaign.findOneAndUpdate({_id:campaignId},{$push:{usersList:{userId:userId,status:"pending"}}},{new:true});
       res.status(200).send({status:200,message:"Request sent successfully",data:update_campaign});
    }
    catch(err){
        console.error('Error(requestToJoinCampaign)....', err);
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang);
    }
};

exports.getRequestedUserList = async (req, res) => {
    try{
        const {campaignId} = req.body;
        console.log("campaignId",campaignId);
        const campaign = await Campaign.findOne({_id:campaignId});
        if(!campaign){
            return sendResponse(res, constants.WEB_STATUS_CODE.NOT_FOUND, constants.STATUS_CODE.FAIL, 'CAMPAIGN.not_found', {}, req.headers.lang);
        }
        const requestedUserList = campaign.usersList;
        res.status(200).send({status:200,message:"Requested User List",data:requestedUserList});
    }
    catch(err){
        console.error('Error(getRequestedUserList)....', err);
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang);
    }
};

exports.updateRequestToJoinCampaign = async (req, res) => {
  try {
    const { userId, campaignId } = req.body;
    const update_campaign = await Campaign.findOneAndUpdate(
      { _id: campaignId, "usersList.userId": userId },
      { $set: { "usersList.$.status": "joined" } },
      { new: true }
    );
    res
      .status(200)
      .send({
        status: 200,
        message: "Request updated successfully",
        data: update_campaign,
      });
  } catch (err) {
    console.error("Error(updateRequestToJoinCampaign)....", err);
    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.SERVER_ERROR,
      constants.STATUS_CODE.FAIL,
      "GENERAL.general_error_content",
      err.message,
      req.headers.lang
    );
  }
};

