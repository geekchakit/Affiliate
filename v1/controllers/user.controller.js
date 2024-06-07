const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendResponse } = require("../../services/common.service");
const dateFormat = require("../../helper/dateformat.helper");
const User = require("../../models/user.model");
const { isValid } = require("../../services/blackListMail");
const { Usersave, convertDaysToDate } = require("../services/user.service");
const Keys = require("../../keys/keys");
const constants = require("../../config/constants");
const { JWT_SECRET } = require("../../keys/keys");
const { v4: uuid } = require("uuid");
const {
  LoginResponse,
  signUpResponse,
  sendVerifyEmail,
  updateResponse,
  accountVerifyResponse,
  sendUserWelcomeEmailJoinedViaAdmin,
} = require("../../ResponseData/user.response");
const { sendMail } = require("../../services/email.services");
const Campaign = require("../../models/campaign.model");
const excelData = require("../../models/excelData.model");
const fs = require("fs");
const xlsx = require("xlsx");
const Tax = require("../../models/tax.model");
const Billing = require("../../models/billing.model");
const { addBill } = require("./billing.controller");
const JoinedCampaign = require("../../models/joinedCampaign.model");
const ExcelHeaders = require("../../models/excelheaders");
const Category = require("../../models/category");
const { name } = require("ejs");
const SpecialDiscountCategory = require("../../models/specialDiscountCategory");
const Referral = require("../../models/referrals");
const getExcelDataModel = require("../../models/excelDataDynamic");

exports.signUp = async (req, res, next) => {
  try {
    const reqBody = req.body;

    // Check if the email is valid
    const checkMail = await isValid(reqBody.email);
    if (!checkMail)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.BAD_REQUEST,
        constants.STATUS_CODE.FAIL,
        "GENERAL.blackList_mail",
        {},
        req.headers.lang
      );

    // Check if the email already exists
    const existEmail = await User.findOne({ email: reqBody.email });
    if (existEmail)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.BAD_REQUEST,
        constants.STATUS_CODE.FAIL,
        "USER.already_exist",
        {},
        req.headers.lang
      );

    // Hash the password
    reqBody.password = await bcrypt.hash(reqBody.password, 10);
    reqBody.created_at = await dateFormat.set_current_timestamp();
    reqBody.updated_at = await dateFormat.set_current_timestamp();

    // Generate a temporary token
    reqBody.tempTokens = await jwt.sign(
      {
        data: reqBody.email,
      },
      JWT_SECRET,
      {
        expiresIn: constants.URL_EXPIRE_TIME,
      }
    );

    // Set device information if available
    reqBody.device_type = reqBody.device_type ? reqBody.device_type : null;
    reqBody.device_token = reqBody.device_token ? reqBody.device_token : null;

    // Generate a unique referral code
    reqBody.referral_code = generateReferralCode();

    // Save the user to the database
    const user = await Usersave(reqBody);
    if (reqBody.referred_by) {
      console.log("referred_by:", reqBody.referred_by);
      const referrer = await User.findOne({
        referral_code: reqBody.referred_by,
      });
      console.log("referrer:", referrer);
      if (referrer) {
        const referral = new Referral({
          referee: user._id,
          refereeCode: reqBody.referral_code,
          referrer: referrer._id,
          referrerCode: reqBody.referred_by,
        });
        await referral.save();
      } else {
        return res.status(201).json({ message: "Invalid referral code" });
      }
    }
    const users = signUpResponse(user);

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "USER.signUp_success",
      users,
      req.headers.lang
    );
  } catch (err) {
    console.log("err(signUp)......", err);
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

// Function to generate a unique referral code
const generateReferralCode = () => {
  return crypto.randomBytes(3).toString("hex"); // Generates a 6-character long hex string
};

exports.getUserUnderReferral = async (req, res) => {
  try {
    const { referralCode } = req.params;
    const usersList = await User.find({ referred_by: referralCode });
    res.status(200).json(usersList);
  } catch (err) {
    console.error("Error(getUserUnderReferral)....", err);
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

exports.logout = async (req, res, next) => {
  try {
    const reqBody = req.user;
    let UserData = await User.findById(reqBody._id);

    UserData.tokens = null;
    UserData.refresh_tokens = null;

    await UserData.save();
    sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "USER.logout_success",
      {},
      req.headers.lang
    );
  } catch (err) {
    console.log(err);
    sendResponse(
      res,
      constants.WEB_STATUS_CODE.SERVER_ERROR,
      constants.STATUS_CODE.FAIL,
      "GENERAL.general_error_content",
      err.message,
      req.headers.lang
    );
  }
};

exports.login = async (req, res, next) => {
  try {
    const reqBody = req.body;

    let user = await User.findByCredentials(
      reqBody.email,
      reqBody.password,
      reqBody.user_type || "2"
    );

    if (!user)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.NOT_FOUND,
        constants.STATUS_CODE.FAIL,
        "USER.user_not_found",
        {},
        req.headers.lang
      );

    if (user == 1)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.BAD_REQUEST,
        constants.STATUS_CODE.FAIL,
        "USER.email_not_found",
        {},
        req.headers.lang
      );
    if (user == 2)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.BAD_REQUEST,
        constants.STATUS_CODE.FAIL,
        "USER.invalid_password",
        {},
        req.headers.lang
      );

    if (user.status == 0)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.BAD_REQUEST,
        constants.STATUS_CODE.FAIL,
        "USER.inactive_account",
        {},
        req.headers.lang
      );
    if (user.status == 2)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.BAD_REQUEST,
        constants.STATUS_CODE.FAIL,
        "USER.deactive_account",
        {},
        req.headers.lang
      );
    if (user.deleted_at != null)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.BAD_REQUEST,
        constants.STATUS_CODE.FAIL,
        "USER.inactive_account",
        {},
        req.headers.lang
      );

    if (user.is_upload === false)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.OK,
        constants.STATUS_CODE.SUCCESS,
        "USER.document_is_not_updated",
        user,
        req.headers.lang
      );

    if (user.is_verify === false)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.OK,
        constants.STATUS_CODE.SUCCESS,
        "USER.acount_not_verify",
        user,
        req.headers.lang
      );

    let newToken = await user.generateAuthToken();
    let refreshToken = await user.generateRefreshToken();

    user.device_type = reqBody.device_type ? reqBody.device_type : null;
    user.device_token = reqBody.device_token ? reqBody.device_token : null;

    await user.save();
    let users = LoginResponse(user);

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "USER.login_success",
      users,
      req.headers.lang
    );
  } catch (err) {
    console.log("err(login).....", err);
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

exports.update_document = async (req, res) => {
  try {
    const reqBody = req.body;
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user || user.user_type !== constants.USER_TYPE.USER)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.UNAUTHORIZED,
        constants.STATUS_CODE.UNAUTHENTICATED,
        "GENERAL.invalid_user",
        {},
        req.headers.lang
      );

    if (user.is_upload === true)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.OK,
        constants.STATUS_CODE.SUCCESS,
        "USER.document_already_updated",
        {},
        req.headers.lang
      );

    const userData = await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          gender: reqBody.gender,
          city: reqBody.city,
          country: reqBody.country,
          state: reqBody.state,
          pancard: reqBody.pancard,
          address: reqBody.address,
          adharacard: reqBody.adharacard,
          date_of_birth: reqBody.date_of_birth,
          is_upload: true,
          updated_at: dateFormat.set_current_timestamp(),
        },
      },
      { new: true }
    );

    const responseData = updateResponse(userData);

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "USER.update_documents",
      responseData,
      req.headers.lang
    );
  } catch (err) {
    console.log("err(update_document).....", err);
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

exports.account_verify = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { userId } = req.params;

    const user = await User.findById(adminId);

    if (!user || user.user_type !== constants.USER_TYPE.ADMIN)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.UNAUTHORIZED,
        constants.STATUS_CODE.UNAUTHENTICATED,
        "GENERAL.invalid_user",
        {},
        req.headers.lang
      );

    const users = await User.findById(userId);

    if (users.is_verify === true)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.OK,
        constants.STATUS_CODE.SUCCESS,
        "USER.already_verify",
        {},
        req.headers.lang
      );

    const userData = await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          is_verify: true,
          updated_at: dateFormat.set_current_timestamp(),
        },
      },
      { new: true }
    );

    const responseData = accountVerifyResponse(userData);
    await sendMail(userData.email, sendVerifyEmail(userData.name));

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "USER.user_account_verify",
      responseData,
      req.headers.lang
    );
  } catch (err) {
    console.log("err(update_document).....", err);
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

exports.get_profile = async (req, res) => {
  try {
    const user_id = req.user._id;
    const { userId } = req.params;
    const user = await User.findById(user_id);

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

    const userData = await User.findById(userId);

    console.log("userData:", userData);

    const taxList = await Tax.find({ userId: userData._id });
    const billList = await Billing.find({ userId: userData._id });
    const referred_by = await User.findOne({
      referral_code: userData.referred_by,
    });
    const data = {
      userData:
        {
          user_id: userData._id,
          email: userData.email,
          name: userData.name,
          mobile_number: userData.mobile_number,
          state: userData.state,
          country: userData.country,
          city: userData.city,
          gender: userData.gender,
          date_of_birth: userData.date_of_birth,
          is_verify: userData.is_verify,
          is_upload: userData.is_upload,
          pancard: userData.pancard,
          address: userData.address,
          adharacard: userData.adharacard,
          referralCode: userData.referral_code,
          referred_by: referred_by ? referred_by.name : null,
        } || {},
      taxList:
        taxList.map((data) => ({
          tax_id: data._id,
          name: data.name,
          type_of_entity: data.type_of_entity,
          pancard: data.pancard,
          country: data.country,
          city: data.city,
          ref_id: data.ref_id,
          address: data.address,
          zipcode: data.zipcode,
        })) || [],
      billingList:
        billList.map((addBill) => ({
          name: addBill.name,
          pan_number: addBill.pan_number,
          entity_type: addBill.entity_type,
          entity: addBill.entity,
          country: addBill.country,
          currency: addBill.currency,
          account_owner_name: addBill.account_owner_name,
          bank_name: addBill.bank_name,
          account_number: addBill.account_number,
          ref_id: addBill.ref_id,
          biil_id: addBill._id,
        })) || [],
    };

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "USER.get_profile",
      data,
      req.headers.lang
    );
  } catch (err) {
    console.log("err(get_profile).....", err);
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

exports.update_profile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user || user.user_type !== constants.USER_TYPE.USER)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.UNAUTHORIZED,
        constants.STATUS_CODE.UNAUTHENTICATED,
        "GENERAL.invalid_user",
        {},
        req.headers.lang
      );

    const userData = await User.findOneAndUpdate({ _id: userId }, req.body, {
      new: true,
    });

    if (!userData)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.OK,
        constants.STATUS_CODE.SUCCESS,
        "USER.user_not_found",
        {},
        req.headers.lang
      );

    const data = {
      user_id: userData._id,
      email: userData.email,
      name: userData.name,
      mobile_number: userData.mobile_number,
      state: userData.state,
      country: userData.country,
      city: userData.city,
      gender: userData.gender,
      date_of_birth: userData.date_of_birth,
      is_verify: userData.is_verify,
      is_upload: userData.is_upload,
      pancard: userData.pancard,
      address: userData.address,
      adharacard: userData.adharacard,
    };

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "USER.update_documents",
      data,
      req.headers.lang
    );
  } catch (err) {
    console.log("err(update_profile).....", err);
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

exports.delete_profile = async (req, res) => {
  try {
    const adminId = req.user._id;
    const user = await User.findOne({ _id: adminId });
    const { userId } = req.params;

    if (!user || user.user_type !== constants.USER_TYPE.ADMIN)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.UNAUTHORIZED,
        constants.STATUS_CODE.UNAUTHENTICATED,
        "GENERAL.invalid_user",
        {},
        req.headers.lang
      );

    const userData = await User.findOneAndDelete({ _id: userId });

    if (!userData)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.OK,
        constants.STATUS_CODE.SUCCESS,
        "USER.user_not_found",
        {},
        req.headers.lang
      );

    const data = {
      user_id: userData._id,
      email: userData.email,
      name: userData.name,
      mobile_number: userData.mobile_number,
      state: userData.state,
      country: userData.country,
      city: userData.city,
      gender: userData.gender,
      date_of_birth: userData.date_of_birth,
      is_verify: userData.is_verify,
      is_upload: userData.is_upload,
      pancard: userData.pancard,
      address: userData.address,
      adharacard: userData.adharacard,
    };

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "USER.user_deleted",
      data,
      req.headers.lang
    );
  } catch (err) {
    console.log("err(delete_profile).....", err);
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

exports.uploadUserData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { userId: targetUserId } = req.body;
    const campaignId = req.body.campaignId;
    console.log("campaignId:", campaignId);

    const user = await User.findById(userId);

    if (!user || user.user_type !== constants.USER_TYPE.ADMIN)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.UNAUTHORIZED,
        constants.STATUS_CODE.FAIL,
        "USER.invalid_user",
        {},
        req.headers.lang
      );

    const allUsers = await User.find();
    const userList = allUsers.map((user) => user._id);

    const joinedCampaigns = await JoinedCampaign.find({
      userId: { $in: userList },
    });
    const trackingIds = joinedCampaigns.map((campaign) => campaign.trackingId);

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const data = xlsx.utils.sheet_to_json(worksheet);
    const dataWithoutSpaces = data.map((obj) => {
      const newObj = {};
      Object.keys(obj).forEach((key) => {
        newObj[key.replace(/\s/g, "")] = obj[key];
      });
      return newObj;
    });

    const mappedData = dataWithoutSpaces
      .filter((item) => trackingIds.includes(item.TrackingID))
      .map((item) => {
        const totalAmount = item.Revenue * 0.05;
        return {
          campaignId: campaignId,
          userId: targetUserId || userId,
          category: item.Category,
          name: item.Name,
          ascin: item.ASIN,
          seller: item.Seller,
          trackingId: item.TrackingID,
          shippedDate: convertDaysToDate(item.ShippedDate),
          price: item.Price,
          itemShipped: item.ItemsShipped,
          returns: item.Returns,
          revenue: item.Revenue,
          rate: item.Rate,
          date: convertDaysToDate(item.Date),
          totalAmount: totalAmount,
        };
      });

    const result = await excelData.insertMany(mappedData);

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "USER.upload_data",
      result,
      req.headers.lang
    );
  } catch (err) {
    console.log("Error in uploadUserData:", err);
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

exports.addCategory = async (req, res) => {
  try {
    const { categoryName, rate } = req.body;
    const category = new Category({
      categoryName,
      defaultRate: rate,
    });
    const newCategory = await category.save();
    res.status(200).json(newCategory);
  } catch (err) {
    console.error("Error(addCategory)....", err);
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

exports.AllExcelData = async (req, res) => {
  try {
    const { userId } = req.body;

    const users = await excelData.find({ userId: userId });

    if (
      !users ||
      ![constants.USER_TYPE.ADMIN, constants.USER_TYPE.USER].includes(
        users.user_type
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

    if (!users || users.length === 0)
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.NOT_FOUND,
        constants.STATUS_CODE.FAIL,
        "USER.user_not_found",
        {},
        req.headers.lang
      );

    return sendResponse(
      res,
      constants.WEB_STATUS_CODE.OK,
      constants.STATUS_CODE.SUCCESS,
      "USER.getAllExcelData",
      users,
      req.headers.lang
    );
  } catch (err) {
    console.error("Error(AllExcelData)....", err);
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

exports.getExcelHeaders = async (req, res) => {
  try {
    console.log("getExcelHeaders");
    const headers = await ExcelHeaders.find();
    res.status(200).json(headers);
  } catch (err) {
    console.error("Error(getExcelHeaders)....", err);
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

exports.calculateUserRevenue = async (req, res) => {
  try {
    const { trackingId } = req.body;
    if (!trackingId) {
      //for all the users
      console.log("For all the users");
      const users = await excelData.find({});
      const userRevenueData = users.reduce((acc, user) => {
        if (!acc[user.userId]) {
          acc[user.userId] = {
            userId: user.userId,
            totalAmount: 0,
          };
        }
        acc[user.userId].totalAmount += user.totalAmount;
        return acc;
      }, {});
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.OK,
        constants.STATUS_CODE.SUCCESS,
        "USER.calculateUserRevenue",
        Object.values(userRevenueData),
        req.headers.lang
      );
    } else {
      console.log("trackingId", trackingId);
      const users = await excelData.find({ trackingId: trackingId });
      const userRevenueData = {
        userId: users[0].userId,
        trackingId: trackingId,
        totalAmount: users.reduce((acc, user) => acc + user.totalAmount, 0),
      };
      return sendResponse(
        res,
        constants.WEB_STATUS_CODE.OK,
        constants.STATUS_CODE.SUCCESS,
        "USER.calculateUserRevenue",
        userRevenueData,
        req.headers.lang
      );
    }
  } catch (err) {
    console.error("Error(calculateUserRevenue)....", err);
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

function convertExcelSerialToMongoDBDate(serialOrDate) {
  // Check if the input is a valid Excel serial number
  const isExcelSerial = Number.isFinite(serialOrDate) && serialOrDate > 0;

  if (isExcelSerial) {
    // Excel's date format starts on January 1, 1900
    const excelStartDate = new Date(1900, 0, 1);
    const millisecondsInADay = 24 * 60 * 60 * 1000;

    // Adjust for the fact that Excel considers 1900 a leap year, which it is not
    const offsetDays = Math.floor(serialOrDate) - 1;
    const fractionalPart = serialOrDate % 1;
    const offsetMilliseconds = fractionalPart * millisecondsInADay;

    const jsDate = new Date(
      excelStartDate.getTime() +
        offsetDays * millisecondsInADay +
        offsetMilliseconds
    );

    // Convert to ISO string for MongoDB
    return jsDate.toISOString();
  } else {
    // If not an Excel serial number, parse the given date directly
    const parsedDate = new Date(serialOrDate);
    if (!isNaN(parsedDate.getTime())) {
      // If parsing successful, return ISO string
      return parsedDate.toISOString();
    } else {
      // If parsing failed, return null or handle the error as needed
      return null;
    }
  }
}

// exports.saveExcelData = async (req, res) => {
//     try {
//         const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
//         const sheetName = workbook.SheetNames[0];
//         const worksheet = workbook.Sheets[sheetName];
//         const jsonData = xlsx.utils.sheet_to_json(worksheet);
//         const headers = req.body.headers;
//         const campaignId = req.body.campaignId;
//         const parsedHeaders = JSON.parse(headers);

//         const mappingLookup = parsedHeaders.reduce(
//             (acc, { oldHeader, newHeader }) => {
//                 acc[oldHeader] = newHeader;
//                 return acc;
//             },
//             {}
//         );

//         const updatedData = jsonData.map((item) => {
//             const newItem = {};
//             for (const key in item) {
//                 const newKey = mappingLookup[key];
//                 newItem[newKey] = item[key];
//             }
//             return newItem;
//         });

//         console.log("updatedData:", updatedData);

//         const dataWithCampaignId = updatedData.map((item) => ({
//             ...item,
//             campaignId,
//             shippedDate: convertExcelSerialToMongoDBDate(item.shippedDate),
//         }));
//         console.log("dataWithCampaignId:", dataWithCampaignId);
//         const saveData = await excelData.insertMany(dataWithCampaignId);
//         res.status(200).json("Data saved successfully");
//     } catch (err) {
//         console.error("Error fetching or adding product data:", err);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };
exports.saveExcelData = async (req, res) => {
  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    console.log(sheetName);
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    const headers = req.body.headers;
    const campaignId = req.body.campaignId;
    const parsedHeaders = JSON.parse(headers);

    const mappingLookup = parsedHeaders.reduce(
      (acc, { oldHeader, newHeader }) => {
        acc[oldHeader] = newHeader;
        return acc;
      },
      {}
    );

    const updatedData = jsonData.map((item) => {
      const newItem = {};
      for (const key in item) {
        const newKey = mappingLookup[key];
        newItem[newKey] = item[key];
      }
      return newItem;
    });

    console.log("updatedData:", updatedData.length);

    const dataWithCampaignId = updatedData.map((item) => ({
      ...item,
      campaignId,
      shippedDate: convertExcelSerialToMongoDBDate(item.shippedDate),
    }));

    console.log("dataWithCampaignId:", dataWithCampaignId);

    //Process each item to get the user ID and save to the corresponding collection
    const savePromises = dataWithCampaignId.map(async (item) => {
      // Find the user ID based on the tracking ID in the Campaign table
      const campaign = await Campaign.findOne({
        "usersList.trackingId": item.trackingId,
      });
      if (campaign) {
        const user = campaign.usersList.find(
          (user) => user.trackingId === item.trackingId
        );
        if (user && user.userId) {
          const userId = user.userId;
          const ExcelData = getExcelDataModel(userId);
          const saveData = new ExcelData(item);
          // console.log("saveData:", saveData);
          await saveData.save();
        }
      }
    });

    await Promise.all(savePromises);

    res.status(200).json("Data saved successfully");
  } catch (err) {
    console.error("Error fetching or adding product data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// exports.getCategory = async (req, res) => {
//     try {
//       console.log("try getCategory", req.params.campignId);
//     const campignId = req.params.campignId;

//     const categories = await Category.find({ campaignId: campignId });
//     res.status(200).json(categories);
//   } catch (err) {
//     console.error("Error(getCategory)....", err);
//     return sendResponse(
//       res,
//       constants.WEB_STATUS_CODE.SERVER_ERROR,
//       constants.STATUS_CODE.FAIL,
//       "GENERAL.general_error_content",
//       err.message,
//       req.headers.lang
//     );
//   }
// };



// exports.getExcelDataForAdmin = async (req, res) => {
//   try {
//     const { campaignId, page = 1, pageSize = 10 } = req.body;
//     const skip = (page - 1) * pageSize;
//     const users = await excelData
//       .find({ campaignId: campaignId })
//       .skip(skip)
//       .limit(pageSize);
//     res.status(200).json(users);
//   } catch (err) {
//     console.error("Error(getExcelData)....", err);
//     return sendResponse(
//       res,
//       constants.WEB_STATUS_CODE.SERVER_ERROR,
//       constants.STATUS_CODE.FAIL,
//       "GENERAL.general_error_content",
//       err.message,
//       req.headers.lang
//     );
//   }
// };

exports.getExcelDataForAdmin = async (req, res) => {
  try {
    const { campaignId, page = 1, pageSize = 10 } = req.body;
    const skip = (page - 1) * pageSize;

    // Fetch campaign data to get the list of users
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Get the list of user tracking IDs from the campaign
    const usersList = campaign.usersList.map((user) => user.trackingId);
    if (!usersList.length) {
      return res
        .status(200)
        .json({ message: "No users found for this campaign" });
    }

    // Fetch excel data for all users in the campaign
    const data = await excelData
      .find({ trackingId: { $in: usersList }, campaignId: campaignId })
      .skip(skip)
      .limit(pageSize);

    //const currentDate = new Date();

    // Calculate commission for each data entry
    const resultData = await Promise.all(
      data.map(async (entry) => {
        console.log(entry);
        const revenue = entry.revenue || 0;
        const categoryName = entry.category;

        let commissionRate;

        const category = await Category.findOne({
          categoryName: categoryName,
          campaignId: campaignId,
        });

        if (category) {
          const categoryId = category._id;
          const specialDiscount = await SpecialDiscountCategory.findOne({
            categoryId: categoryId,
            campaignId: campaignId,
            startDate: { $lte: entry.shippedDate },
            endDate: { $gte: entry.shippedDate },
            isActive: true,
          });

          if (specialDiscount) {
            commissionRate = specialDiscount.rate;
          } else {
            commissionRate = category.defaultRate;
          }
        }

        const commission =
          commissionRate && revenue ? revenue * (commissionRate / 100) : 0;
        return {
          ...entry._doc,
          commission,
        };
      })
    );

    res.status(200).json(resultData);
  } catch (err) {
    console.error("Error(getExcelDataForAdmin)....", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getTotalRevenueAndCommissionForUserSpecific = async (req, res) => {
  try {
    const { userId, campaignId } = req.body;
    console.log("userId:", userId);
    console.log("campaignId:", campaignId);
    console.log("req.body:", req.body);

    // Set the date to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    let trackingId;

    const campaign = await Campaign.findById(campaignId);
    console.log("campaign:", campaign);
    if (campaign) {
      const user = campaign.usersList.find(
        (user) => user.userId.toString() === userId
      );
      trackingId = user ? user.trackingId : null;
      console.log("trackingId:", trackingId);
      // Get the dynamic model for the user
      const ExcelData = getExcelDataModel(userId);

      const data = await ExcelData.find({
        trackingId: trackingId,
        campaignId: campaignId,
        shippedDate: { $lte: yesterday },
      });

      let totalRevenue = 0;
      let totalCommission = 0;

      for (const entry of data) {
        const revenue = entry.revenue || 0;
        const categoryName = entry.category;

        let commissionRate;
        console.log(categoryName);
        console.log(campaignId);
        const category = await Category.findOne({
          categoryName: categoryName,
          campaignId: campaignId,
        });

        console.log(category);

        if (category) {
          const categoryId = category._id;
          const specialDiscount = await SpecialDiscountCategory.findOne({
            categoryId: categoryId,
            campaignId: campaignId,
            startDate: { $lte: entry.shippedDate },
            endDate: { $gte: entry.shippedDate },
            userId: userId,
            isActive: true,
          });

          if (specialDiscount) {
            console.log("Special");
            commissionRate = specialDiscount.rate;
          } else {
            console.log("Master");
            commissionRate = category.defaultRate;
          }
        }

        const commission =
          commissionRate && revenue ? revenue * (commissionRate / 100) : 0;
        totalRevenue += revenue;
        totalCommission += commission;
      }

      res.status(200).json({
        totalRevenue,
        totalCommission,
      });
    } else {
      console.log("Campaign not found for userId:", userId);
      res.status(200).json({ message: "Campaign not found for userId" });
    }
  } catch (err) {
    console.error("Error(getTotalRevenueAndCommissionForUser)....", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getTotalRevenueAndCommissionForUser = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log("userId:", userId);
    console.log("req.body:", req.body);

    // Set the date to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    let totalRevenue = 0;
    let totalCommission = 0;

    // Find all campaigns associated with the user
    const campaigns = await Campaign.find({ "usersList.userId": userId });

    console.log("campaigns:", campaigns);

    for (const campaign of campaigns) {
      const user = campaign.usersList.find(
        (user) => user.userId.toString() === userId
      );
      const trackingId = user ? user.trackingId : null;
      console.log("trackingId:", trackingId);
      if (trackingId == null) continue;

      // Get the dynamic model for the user
      const ExcelData = getExcelDataModel(userId);

      // console.log("yesterday:", yesterday);

      // console.log("campaign:", campaign);

      // console.log(ExcelData)

      const data = await ExcelData.find({
        trackingId: trackingId,
        campaignId: campaign._id,
        shippedDate: { $lte: yesterday },
      });

      // console.log("data:", data);

      for (const entry of data) {
        const revenue = entry.revenue || 0;
        const categoryName = entry.category;

        const category = await Category.findOne({
          categoryName: categoryName,
          campaignId: campaign._id,
        });

        let commissionRate = 0;
        if (category) {
          const categoryId = category._id;
          const specialDiscount = await SpecialDiscountCategory.findOne({
            categoryId: categoryId,
            campaignId: campaign._id,
            startDate: { $lte: entry.shippedDate },
            endDate: { $gte: entry.shippedDate },
            userId: userId,
            isActive: true,
          });

          if (specialDiscount) {
            // console.log("Special");
            commissionRate = specialDiscount.rate;
          } else {
            // console.log("Master");
            commissionRate = category.defaultRate;
          }
        }

        const commission =
          commissionRate && revenue ? revenue * (commissionRate / 100) : 0;
        totalRevenue += revenue;
        totalCommission += commission;
      }
    }

    res.status(200).json({
      totalRevenue,
      totalCommission,
    });
  } catch (err) {
    console.error("Error(getTotalRevenueAndCommissionForUser):", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// exports.getExcelDataForUser = async (req, res) => {
//   try {
//     const { userId, campaignId, page = 1, pageSize = 10 } = req.body;
//     console.log("userId:", userId);
//     console.log("campaignId:", campaignId);
//     var trackingId;
//     Campaign.findOne({ "usersList.userId": userId })
//       .then(async (campaign) => {
//         if (campaign) {
//           const user = campaign.usersList.find(
//             (user) => user.userId.toString() === userId
//           );
//           trackingId = user ? user.trackingId : null;
//           const skip = (page - 1) * pageSize;
//           const data = await excelData.find({ trackingId: trackingId, campaignId: campaignId }).skip(skip).limit(pageSize);

//           res.status(200).json(data);
//         } else {
//           console.log("Campaign not found for userId:", userId);
//           res.status(200).json("Campaign not found for userId:", userId);
//         }
//       })
//       .catch((err) => {
//         console.error("Error:", err);
//         res.status(500).json({ error: "Internal server error" });
//       });
//   } catch (err) {
//     console.error("Error(getExcelData)....", err);
//     return sendResponse(
//       res,
//       constants.WEB_STATUS_CODE.SERVER_ERROR,
//       constants.STATUS_CODE.FAIL,
//       "GENERAL.general_error_content",
//       err.message,
//       req.headers.lang
//     );
//   }
// };

// exports.getExcelDataForUser = async (req, res) => {
//     try {
//         const { userId, campaignId, page = 1, pageSize = 10 } = req.body;
//         console.log("userId:", userId);
//         console.log("campaignId:", campaignId);

//         //const currentDate = new Date();
//         let trackingId;

//         const campaign = await Campaign.findOne({ "usersList.userId": userId });
//         if (campaign) {
//             const user = campaign.usersList.find(user => user.userId.toString() === userId);
//             trackingId = user ? user.trackingId : null;

//             const skip = (page - 1) * pageSize;
//             const data = await excelData.find({ trackingId: trackingId, campaignId: campaignId }).skip(skip).limit(pageSize);

//             // Calculate the commission for each data entry
//             const resultData = await Promise.all(data.map(async entry => {
//                 const revenue = entry.revenue || 0; // Assuming 'revenue' field exists in excelData
//                 const categoryName = entry.category; // Assuming each entry has a category field with the name of the category

//                 let commissionRate;
//                 console.log(categoryName)
//                 console.log(campaignId)
//                 const category = await Category.findOne({ categoryName: categoryName, campaignId: campaignId });

//                 console.log(category);

//                 if (category) {
//                     const categoryId = category._id;
//                     const specialDiscount = await SpecialDiscountCategory.findOne({
//                         categoryId: categoryId,
//                         campaignId: campaignId,
//                         startDate: { $lte: entry.shippedDate },
//                         endDate: { $gte: entry.shippedDate },
//                         isActive: true
//                     });

//                     if (specialDiscount) {
//                         console.log("Special");
//                         commissionRate = specialDiscount.rate;
//                     } else {
//                         console.log("Master");
//                         commissionRate = category.defaultRate;
//                     }
//                 }

//                 const commission = (commissionRate && revenue) ? (revenue * (commissionRate / 100)) : 0;
//                 return {
//                     ...entry._doc,
//                     commission
//                 };
//             }));

//             res.status(200).json(resultData);
//         } else {
//             console.log("Campaign not found for userId:", userId);
//             res.status(200).json({ message: "Campaign not found for userId" });
//         }
//     } catch (err) {
//         console.error("Error(getExcelDataForUser)....", err);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };

exports.getExcelDataForUser = async (req, res) => {
  try {
    const { userId, campaignId, page = 1, pageSize = 10 } = req.body;
    console.log("userId:", userId);
    console.log("campaignId:", campaignId);

    let trackingId;

    const campaign = await Campaign.findOne({ "usersList.userId": userId });
    if (campaign) {
      const user = campaign.usersList.find(
        (user) => user.userId.toString() === userId
      );
      trackingId = user ? user.trackingId : null;

      const skip = (page - 1) * pageSize;

      // Get the dynamic model for the user
      const ExcelData = getExcelDataModel(userId);

      const data = await ExcelData.find({
        trackingId: trackingId,
        campaignId: campaignId,
      })
        .skip(skip)
        .limit(pageSize);

      // Calculate the commission for each data entry
      const resultData = await Promise.all(
        data.map(async (entry) => {
          const revenue = entry.revenue || 0; // Assuming 'revenue' field exists in excelData
          const categoryName = entry.category; // Assuming each entry has a category field with the name of the category

          let commissionRate;
          console.log(categoryName);
          console.log(campaignId);
          const category = await Category.findOne({
            categoryName: categoryName,
            campaignId: campaignId,
          });

          console.log(category);

          if (category) {
            const categoryId = category._id;
            const specialDiscount = await SpecialDiscountCategory.findOne({
              categoryId: categoryId,
              campaignId: campaignId,
              startDate: { $lte: entry.shippedDate },
              endDate: { $gte: entry.shippedDate },
              isActive: true,
            });

            if (specialDiscount) {
              console.log("Special");
              commissionRate = specialDiscount.rate;
            } else {
              console.log("Master");
              commissionRate = category.defaultRate;
            }
          }

          const commission =
            commissionRate && revenue ? revenue * (commissionRate / 100) : 0;
          return {
            ...entry._doc,
            commission,
          };
        })
      );

      res.status(200).json(resultData);
    } else {
      console.log("Campaign not found for userId:", userId);
      res.status(200).json({ message: "Campaign not found for userId" });
    }
  } catch (err) {
    console.error("Error(getExcelDataForUser)....", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.addUserViaAdmin = async (req, res) => {
  try {
    let { email, name, mobile_number, password } = req.body;

    const unHasedPassword = password;
    password = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      name,
      mobile_number,
      password,
      status: 1,
    });
    const newUser = await user.save();
    await sendMail(
      email,
      sendUserWelcomeEmailJoinedViaAdmin(name, unHasedPassword, email)
    );
    res.status(200).json(newUser);
  } catch (err) {
    console.error("Error(addUserViaAdmin)....", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
