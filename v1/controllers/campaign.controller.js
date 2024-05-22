const { sendResponse } = require("../../services/common.service");
const dateFormat = require("../../helper/dateformat.helper");
const User = require("../../models/user.model");
const { saveCampaign } = require("../services/campaign.service");
const Keys = require("../../keys/keys");
const constants = require("../../config/constants");
const { addCampaignResponse } = require("../../ResponseData/campaign.reponse");
const Campaign = require("../../models/campaign.model");
const { BASEURL } = require("../../keys/development.keys");
const JoinedCampaign = require("../../models/joinedCampaign.model");
const { sendMailForCampaign } = require("../../services/email.services");
const {
  sendCampignAcceptanceEmail,
  sendConfirmationForAddedToCampignViaAdmin,
} = require("../../ResponseData/user.response");
const { upload } = require("../../middleware/multer");
const SpecialDiscountCategory = require('../../models/specialDiscountCategory');
const Category = require("../../models/category");

exports.addNewCampaign = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const userId = req.user._id;
    const users = await User.findById(userId);

    if (!users || users.user_type !== constants.USER_TYPE.ADMIN)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.UNAUTHORIZED,
        constants.STATUS_CODE.UNAUTHENTICATED,
        "USER.invalid_user",
        {},
        req.headers.lang
      );

    const existCampaignName = await Campaign.findOne({
      campaignName: reqBody.campaignName,
    });

    if (existCampaignName)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.BAD_REQUEST,
        constants.STATUS_CODE.FAIL,
        "CAMPAIGN.already_existing_campaigns",
        {},
        req.headers.lang
      );

    reqBody.created_at = await dateFormat.set_current_timestamp();
    reqBody.updated_at = await dateFormat.set_current_timestamp();

    const campaign = await saveCampaign(reqBody);
    const campaginResponse = addCampaignResponse(campaign);

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.CREATED,
      constants.STATUS_CODE.SUCCESS,
      "CAMPAIGN.addNewCampaign",
      campaginResponse,
      req.headers.lang
    );
  } catch (err) {
    console.log("err(addNewCampaign)......", err);
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

exports.getAllCampaignsList = async (req, res) => {
  try {
    const { campaignName, isFavourite } = req.query;
    const query = {};

    if (campaignName) {
      const campaignNameRegex = new RegExp(campaignName, "i");
      query.$or = [
        { campaignName: campaignNameRegex },
        { email: campaignNameRegex },
      ];
    }

    if (isFavourite) {
      query.isFavourite = isFavourite;
    }

    const [campaigns, totalCampaigns] = await Promise.all([
      Campaign.find(query)
        .select(
          "_id campaignName status countryName CampaignImage commissionName paymentTerm conversionRate confirmationRate isFavourite usersList"
        )
        .populate("userId", "_id full_name email mobile_number")
        .sort({ createdAt: -1 }),
      Campaign.countDocuments(query),
    ]);

    const campaingsUserCount = campaigns.map((campaign) => {
        return {
            campaignName: campaign.campaignName,
            totalJoinedUsers: campaign.usersList.filter(user => user.status === 'joined').length,
            totalRequestedUsers: campaign.usersList.filter(user => user.status === 'pending').length,
        };
    });

    if (!campaigns || campaigns.length === 0) {
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.OK,
        constants.STATUS_CODE.SUCCESS,
        "CAMPAIGN.not_found",
        [],
        req.headers.lang
      );
    }
    
    const campaignNameCounts = {};
    const userIdSet = new Set();
    // let totalJoinedUsers;
    campaigns.forEach((campaign) => {
      const { campaignName } = campaign;
    //   totalJoinedUsers = campaign.usersList.length;
      if (!campaignNameCounts[campaignName]) {
        campaignNameCounts[campaignName] = 0;
      }
      campaignNameCounts[campaignName]++;
    });
    
    

    const data = {
      totalCampaigns: totalCampaigns,
      campaignNameCounts: campaignNameCounts,
      campignsUserCount: campaingsUserCount,
      campaigns: campaigns,
    };

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "CAMPAIGN.getAllCampaigns",
      data,
      req.headers.lang
    );
  } catch (err) {
    console.error("Error(getAllCampaignsList)....", err);
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

exports.isFavouriteCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user._id;
    const users = await User.findById(userId);

    if (!users || users.user_type !== constants.USER_TYPE.USER)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.UNAUTHORIZED,
        constants.STATUS_CODE.UNAUTHENTICATED,
        "USER.invalid_user",
        {},
        req.headers.lang
      );

    const campaign = await Campaign.findById(campaignId);

    if (!campaign)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.NOT_FOUND,
        constants.STATUS_CODE.FAIL,
        "CAMPAIGN.not_found",
        {},
        req.headers.lang
      );
    campaign.isFavourite = true;
    campaign.updated_at = dateFormat.set_current_timestamp();

    await campaign.save();
    campaign.userId = undefined;
    campaign.deleted_at = undefined;

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "CAMPAIGN.faviorite_campaigns",
      campaign,
      req.headers.lang
    );
  } catch (err) {
    console.error("Error(isFavouriteCampaign)....", err);
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

exports.updateCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user._id;
    const reqBody = req.body;
    const users = await User.findById(userId);

    if (!users || users.user_type !== constants.USER_TYPE.ADMIN)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.UNAUTHORIZED,
        constants.STATUS_CODE.UNAUTHENTICATED,
        "USER.invalid_user",
        {},
        req.headers.lang
      );

    const campaign = await Campaign.findById(campaignId);

    if (!campaign)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.NOT_FOUND,
        constants.STATUS_CODE.FAIL,
        "CAMPAIGN.not_found",
        {},
        req.headers.lang
      );

    campaign.campaignName = reqBody.campaignName || campaign.campaignName;
    campaign.status = reqBody.status || campaign.status;
    campaign.countryName = reqBody.countryName || campaign.countryName;
    campaign.paymentTerm = reqBody.paymentTerm || campaign.paymentTerm;
    campaign.conversionRate = reqBody.conversionRate || campaign.conversionRate;
    campaign.confirmationRate =
      reqBody.confirmationRate || campaign.confirmationRate;
    campaign.commissionName = reqBody.commissionName || campaign.commissionName;
    campaign.updated_at = dateFormat.set_current_timestamp();

    await campaign.save();

    campaign.userId = undefined;
    campaign.deleted_at = undefined;

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "CAMPAIGN.update_campaign",
      campaign,
      req.headers.lang
    );
  } catch (err) {
    console.error("Error(updateCampaign)....", err);
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

exports.getCampaign = async (req, res) => {
  try {
    const { campaignID } = req.params;
    const userId = req.user._id;
    const users = await User.findById(userId);

    if (!users || users.user_type !== constants.USER_TYPE.ADMIN)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.UNAUTHORIZED,
        constants.STATUS_CODE.UNAUTHENTICATED,
        "USER.invalid_user",
        {},
        req.headers.lang
      );

    const campaign = await Campaign.findById(campaignID);

    if (!campaign)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.NOT_FOUND,
        constants.STATUS_CODE.FAIL,
        "CAMPAIGN.not_found",
        {},
        req.headers.lang
      );

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "CAMPAIGN.get_campaign",
      campaign,
      req.headers.lang
    );
  } catch (err) {
    console.error("Error(getCampaign)....", err);
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

exports.deleteCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user._id;
    const users = await User.findById(userId);

    if (!users || users.user_type !== constants.USER_TYPE.ADMIN)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.UNAUTHORIZED,
        constants.STATUS_CODE.UNAUTHENTICATED,
        "USER.invalid_user",
        {},
        req.headers.lang
      );

    const campaign = await Campaign.findByIdAndDelete(campaignId);

    if (!campaign)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.NOT_FOUND,
        constants.STATUS_CODE.FAIL,
        "CAMPAIGN.not_found",
        {},
        req.headers.lang
      );

    campaign.userId = undefined;

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "CAMPAIGN.delete_campaign",
      campaign,
      req.headers.lang
    );
  } catch (err) {
    console.error("Error(deleteCampaign)....", err);
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

exports.uploadImage = async (req, res) => {
  try {
    console.log("uploadImage");
    console.log(req.file);
    console.log(req.campaignId);
    const { campaignId } = req.body;
    const userId = req.user._id;
    const users = await User.findById(userId);

    if (!users || users.user_type !== constants.USER_TYPE.ADMIN)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.UNAUTHORIZED,
        constants.STATUS_CODE.UNAUTHENTICATED,
        "USER.invalid_user",
        {},
        req.headers.lang
      );

    const campaign = await Campaign.findById(campaignId);

    if (!campaign)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.NOT_FOUND,
        constants.STATUS_CODE.FAIL,
        "CAMPAIGN.not_found",
        {},
        req.headers.lang
      );

    const files = req.file;
    console.log("files", files);
    campaign.CampaignImage = `${BASEURL}/uploads/${files.filename}`;
    await campaign.save();

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "CAMPAIGN.delete_campaign",
      campaign,
      req.headers.lang
    );
  } catch (err) {
    console.error("Error(uploadImage)....", err);
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

exports.getAllCampaignsRequestList = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, campaignRequest } = req.query;

    const user = await User.findById(userId);

    if (
      !user ||
      ![constants.USER_TYPE.ADMIN, constants.USER_TYPE.USER].includes(
        user.user_type
      )
    )
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.BAD_REQUEST,
        constants.STATUS_CODE.FAIL,
        "GENERAL.unauthorized_user",
        {},
        req.headers.lang
      );

    const query = {};
    if (status) {
      query.status = status;
    }

    if (campaignRequest) {
      const campaignRequestRegex = new RegExp(campaignRequest, "i");
      query.$or = [{ campaignRequest: campaignRequestRegex }];
    }

    let campaigns;
    let totalCampaigns;
    if (Object.keys(query).length === 0) {
      campaigns = await Campaign.find()
        .select(
          "_id campaignName status campaignRequest countryName commissionName CampaignImage paymentTerm conversionRate confirmationRate isFavourite"
        )
        .populate("userId", "_id full_name email campaign")
        .sort()
        .lean();

      totalCampaigns = await Campaign.countDocuments();
    } else {
      campaigns = await Campaign.find(query)
        .select(
          "_id campaignName status campaignRequest countryName CampaignImage commissionName paymentTerm conversionRate confirmationRate isFavourite"
        )
        .populate("userId", "_id name email mobile_number")
        .sort()
        .lean();

      totalCampaigns = await Campaign.countDocuments(query);
    }

    const responseData =
      campaigns.map((data) => ({
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
        CampaignId: data._id,
      })) || [];

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "CAMPAIGN.campaign_request_list",
      responseData,
      req.headers.lang
    );
  } catch (err) {
    console.error("Error(getAllCampaignsRequestList)....", err);
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

exports.updateCampaignRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const reqBody = req.body;
    const { campaignId } = reqBody;
    const users = await User.findById(userId);

    if (!users || users.user_type !== constants.USER_TYPE.USER)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.UNAUTHORIZED,
        constants.STATUS_CODE.UNAUTHENTICATED,
        "USER.invalid_user",
        {},
        req.headers.lang
      );

    reqBody.created_at = dateFormat.set_current_timestamp();
    reqBody.updated_at = dateFormat.set_current_timestamp();
    reqBody.campaignId = campaignId;
    reqBody.userId = userId;

    const campaign = await JoinedCampaign.create(reqBody);

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "CAMPAIGN.update_campaign_request",
      campaign,
      req.headers.lang
    );
  } catch (err) {
    console.error("Error(updateCampaignRequest)....", err);
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

exports.requestToJoinCampaign = async (req, res) => {
  try {
    console.log("requestToJoinCampaign");
    const { userId, campaignId } = req.body;
    const userDetails = await User.findById(userId);
    const update_campaign = await Campaign.findOneAndUpdate(
      { _id: campaignId },
      { $push: { usersList: { userId: userId, status: "pending" } } },
      { new: true }
    );
    console.log(update_campaign);
    res
      .status(200)
      .send({
        status: 200,
        message: "Request sent successfully",
        data: update_campaign,
      });
  } catch (err) {
    console.error("Error(requestToJoinCampaign)....", err);
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

exports.getRequestedUserList = async (req, res) => {
  try {
    const { campaignID } = req.body;
    console.log("campaignId", campaignID);
    const campaign = await Campaign.findOne({ _id: campaignID });
    if (!campaign) {
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.NOT_FOUND,
        constants.STATUS_CODE.FAIL,
        "CAMPAIGN.not_found",
        {},
        req.headers.lang
      );
    }
    const requestedUserList = campaign.usersList;
    let requestedUserListData = await Promise.all(
      requestedUserList.map(async (requestedUser) => {
        const userDetails = await User.findById(requestedUser.userId);
        if (!userDetails) {
          return null;
        }
        const data = {
          name: userDetails.name,
          gender: userDetails.gender,
          date_of_birth: userDetails.date_of_birth,
          email: userDetails.email,
          mobile_number: userDetails.mobile_number,
          adharacard: userDetails.adharacard,
          status: requestedUser.status,
          state: userDetails.state,
          country: userDetails.country,
          city: userDetails.city,
          address: userDetails.address,
          pancard: userDetails.pancard,
          user_type: userDetails.user_type,
          is_verify: userDetails.is_verify,
          is_upload: userDetails.is_upload,
          userId: userDetails._id,
        };
        // console.log(data);
        return data;
      })
    );
    requestedUserListData = requestedUserListData.filter(data => data !== null);
    const pendingUser = requestedUserListData.filter(
      (requestedData) => requestedData.status !== undefined && requestedData.status === "pending"
    );
    const joinedUser = requestedUserListData.filter(
      (requestedData) => requestedData.status !== undefined && requestedData.status === "joined"
    );
    res
      .status(200)
      .send({
        status: 200,
        message: "Requested User List",
        data: { pendingUser, joinedUser },
      });
  } catch (err) {
    console.error("Error(getRequestedUserList)....", err);
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

exports.updateRequestToJoinCampaign = async (req, res) => {
  try {
    const { userId, campaignId, trackingId } = req.body;
    console.log(userId);
    console.log(campaignId);
    console.log(trackingId);
    const update_campaign = await Campaign.findOneAndUpdate(
      { _id: campaignId, "usersList.userId": userId },
      {
        $set: {
          "usersList.$.status": "joined",
          "usersList.$.trackingId": trackingId,
        },
      },
      { new: true }
    );
    const userData = await User.findById(userId);
    // console.log("update_campaign", update_campaign);
    // await sendMail(update_campaign.email, sendCampignAcceptanceEmail(update_campaign.name, campignDetails.campaignName));
    await sendMailForCampaign(
      "chakitsharma444@gmail.com",
      sendCampignAcceptanceEmail(userData.name, update_campaign.name)
    );
    res.status(200).send({
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

exports.getCampaignForUser = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log("userId", userId);

    // Fetch all campaigns
    const campaigns = await Campaign.find();

    // Process each campaign
    const campaignDetails = await Promise.all(
      campaigns.map(async (camp) => {
        // Check if userId exists in usersList
        const userIndex = camp.usersList.findIndex(
          (user) => user.userId == userId
        );
        const campaignRequest =
          userIndex !== -1 ? camp.usersList[userIndex].status : "request";

        return {
          campaignName: camp.campaignName,
          status: camp.status,
          countryName: camp.countryName,
          commissionName: camp.commissionName,
          paymentTerm: camp.paymentTerm,
          conversionRate: camp.conversionRate,
          confirmationRate: camp.confirmationRate,
          CampaignImage: camp.CampaignImage,
          campaignRequest: campaignRequest,
          isFavourite: camp.isFavourite,
          created_at: camp.created_at,
          CampaignId: camp._id,
          userId: userId,
        };
      })
    );

    res
      .status(200)
      .send({ status: 200, message: "Campaign List", data: campaignDetails });
  } catch (err) {
    console.error("Error(getCampaignForUser)....", err);
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

exports.adduserToCampaignViaAdmin = async (req, res) => {
  try {
    const { userId, campaignId, trackingId,email } = req.body;
    const campaign = await Campaign.findOne({ _id: campaignId });
    if (!campaign) {
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.NOT_FOUND,
        constants.STATUS_CODE.FAIL,
        "CAMPAIGN.not_found",
        {},
        req.headers.lang
      );
    }
    const user = await User.findOne({ email: email});
    if (!user) {
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.NOT_FOUND,
        constants.STATUS_CODE.FAIL,
        "USER.not_found",
        {},
        req.headers.lang
      );
    }
    const userIndex = campaign.usersList.findIndex(
      (user) => user.userId == userId
    );
    if (userIndex !== -1) {
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.BAD_REQUEST,
        constants.STATUS_CODE.FAIL,
        "CAMPAIGN.user_already_added",
        {},
        req.headers.lang
      );
    }
    campaign.usersList.push({
      userId: userId,
      status: "joined",
      trackingId: trackingId,
    });
    await campaign.save();
    await sendMailForCampaign(
      user.email,
      sendConfirmationForAddedToCampignViaAdmin(
        user.name,
        campaign.campaignName
      )
    );
    res
      .status(200)
      .send({
        status: 200,
        message: "User added to campaign successfully",
        data: campaign,
      });
  } catch (err) {
    console.error("Error(adduserToCampaignViaAdmin)....", err);
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

module.exports.addSpecialCategory = async (req, res) => {
  try{
    const data = req.body;
    const category= await Category.findById(data.categoryId);
    const specialCategory ={
      categoryName: category.categoryName,
      categoryId: data.categoryId,
      startDate: data.startDate,
      endDate: data.endDate,
      rate: data.rate,
      campignId: data.campignId,
    };
    const specialCategoryData = await SpecialDiscountCategory.create(specialCategory);
    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.CREATED,
      constants.STATUS_CODE.SUCCESS,
      "CAMPAIGN.add_special_category",
      specialCategoryData,
      req.headers.lang
    );
  }
  catch(err){
    console.error("Error(addSpecialCategory)....", err);
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

module.exports.getSpecialCategory = async (req, res) => {
  try{
    const campignId= req.params.campignId;
    const specialCategory = await SpecialDiscountCategory.find({campignId: campignId});
    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "CAMPAIGN.get_special_category",
      specialCategory,
      req.headers.lang
    );
  }
  catch(err){
    console.error("Error(getSpecialCategory)....", err);
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