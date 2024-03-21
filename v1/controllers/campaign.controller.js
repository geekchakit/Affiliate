
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
        const { campaignName } = req.query;

        const query = {};

        if (campaignName) {
            query.campaignName = campaignName;
        }

        let campaigns;
        let totalCampaigns;

        // Check if query has any filters
        if (Object.keys(query).length === 0) {
            campaigns = await Campaign.find()
                .select('_id campaignName status countryName commissionName paymentTerm conversionRate confirmationRate')
                .populate('userId', '_id full_name email campaign')
                .sort()
                .lean();

                totalCampaigns = await Campaign.countDocuments();
        } else {
            // If no filters, fetch all campaigns
            campaigns = await Campaign.find(query)
                .select('_id campaignName status countryName commissionName paymentTerm conversionRate confirmationRate')
                .populate('userId', '_id full_name email campaign')
                .sort()
                .lean();

                totalCampaigns = await Campaign.countDocuments(query);
        }

        if (!campaigns || campaigns.length === 0) {
            return sendResponse(res, constants.WEB_STATUS_CODE.NOT_FOUND, constants.STATUS_CODE.FAIL, 'CAMPAIGN.not_found', {}, req.headers.lang);
        }

        const campaignNameCounts = {};
        const userIdCounts = {};

        campaigns.forEach(campaign => {
            const campaignName = campaign.campaignName;

            if (!campaignNameCounts[campaignName]) {
                campaignNameCounts[campaignName] = 0;
                userIdCounts[campaignName] = new Set();
            }

            if (campaign.userId) {
                campaign.userId.forEach(user => {
                    userIdCounts[campaignName].add(user._id.toString());
                });
                campaignNameCounts[campaignName]++;
            }
        });

        // Count the total number of unique users across all campaigns
        let totalUniqueUsers = 0;
        for (const campaignName in userIdCounts) {
            totalUniqueUsers += userIdCounts[campaignName].size;
        }

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
