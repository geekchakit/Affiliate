const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
    sendResponse
} = require('../../services/common.service')
const dateFormat = require('../../helper/dateformat.helper');
const User = require('../../models/user.model')
const {
    isValid
} = require('../../services/blackListMail')
const {
    Usersave,
} = require('../services/user.service');
const Keys = require('../../keys/keys')
const constants = require('../../config/constants')
const {
    JWT_SECRET
} = require('../../keys/keys');
const { v4: uuid } = require('uuid');
const { LoginResponse, signUpResponse, sendWelcomeEmail } = require('../../ResponseData/user.response');
const { sendMail } = require('../../services/email.services')
const Campaign = require('../../models/campaign.model')
const excelData = require('../../models/excelData.model')
const fs = require('fs');
const xlsx = require('xlsx');



exports.signUp = async (req, res, next) => {

    try {

        const reqBody = req.body

        const checkMail = await isValid(reqBody.email)
        if (checkMail == false)
            return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'GENERAL.blackList_mail', {}, req.headers.lang);

        const existEmail = await User.findOne({ email: reqBody.email });
        if (existEmail)
            return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.already_exist', {}, req.headers.lang);

        reqBody.password = await bcrypt.hash(reqBody.password, 10);
        reqBody.created_at = await dateFormat.set_current_timestamp();
        reqBody.updated_at = await dateFormat.set_current_timestamp();
        reqBody.tempTokens = await jwt.sign({
            data: reqBody.email
        }, JWT_SECRET, {
            expiresIn: constants.URL_EXPIRE_TIME
        });
        let arr = [];
        arr.push(reqBody.campaign)
        reqBody.campaign = arr
        reqBody.IdNumber = uuid()
        reqBody.device_type = (reqBody.device_type) ? reqBody.device_type : null
        reqBody.device_token = (reqBody.device_token) ? reqBody.device_token : null
        const user = await Usersave(reqBody);

        const campaigns = await Campaign.findOne({ campaignName: reqBody.campaign });
        let arr2 = []
        arr2.push(user._id);
        campaigns.userId = arr2;
        await campaigns.save();
        const users = signUpResponse(user)

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'USER.signUp_success', users, req.headers.lang);

    } catch (err) {
        console.log("err(signUp)......", err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}




exports.logout = async (req, res, next) => {

    try {

        const reqBody = req.user
        let UserData = await User.findById(reqBody._id)

        UserData.tokens = null
        UserData.refresh_tokens = null

        await UserData.save()
        sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'USER.logout_success', {}, req.headers.lang);

    } catch (err) {
        console.log(err)
        sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}



exports.login = async (req, res, next) => {

    try {

        const reqBody = req.body

        let user = await User.findByCredentials(reqBody.email, reqBody.password, reqBody.user_type || '2');

        if (!user)
            return sendResponse(res, constants.WEB_STATUS_CODE.NOT_FOUND, constants.STATUS_CODE.FAIL, 'USER.user_not_found', {}, req.headers.lang);

        if (user == 1) return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.email_not_found', {}, req.headers.lang);
        if (user == 2) return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.invalid_password', {}, req.headers.lang);

        if (user.status == 0) return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.inactive_account', {}, req.headers.lang);
        if (user.status == 2) return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.deactive_account', {}, req.headers.lang);
        if (user.deleted_at != null) return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.inactive_account', {}, req.headers.lang);

        let newToken = await user.generateAuthToken();
        let refreshToken = await user.generateRefreshToken()

        user.device_type = (reqBody.device_type) ? reqBody.device_type : null
        user.device_token = (reqBody.device_token) ? reqBody.device_token : null;
        let otp = Math.floor(100000 + Math.random() * 900000);
        user.OTP = otp
        let text = sendWelcomeEmail(user.full_name, otp)
        sendMail(user.email, text)

        await user.save();
        let users = LoginResponse(user)

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'USER.login_success', users, req.headers.lang);

    } catch (err) {
        console.log('err(login).....', err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}



exports.verifyOtp = async (req, res) => {

    try {

        const userId = req.user._id;
        const users = await User.findById(userId);

        if (!users || users.user_type !== constants.USER_TYPE.USER)
            return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.FAIL, 'USER.invalid_user', {}, req.headers.lang);

        if (users.OTP !== req.body.otp && users.OTP === null)
            return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.otp_not_matched', {}, req.headers.lang);

        users.OTP = null;
        users.isVerify = true;
        users.updated_at = dateFormat.set_current_timestamp();
        await users.save();

        let user = signUpResponse(users)

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'USER.verify_otp', user, req.headers.lang);

    } catch (err) {
        console.log('err(verifyOtp).....', err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}



exports.uploadUserData = async (req, res) => {

    try {

        const userId = req.user._id;
        const users = await User.findById(userId);

        const { userID } = req.body;
        const user = await User.findById(userID)
        console.log(user)

        if (!users || users.user_type !== constants.USER_TYPE.ADMIN)
            return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.FAIL, 'USER.invalid_user', {}, req.headers.lang);


        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const data = xlsx.utils.sheet_to_json(worksheet);
        console.log(users.trackingId)
        const dataWithoutSpaces = data.map(obj => {
            const newObj = {};
            Object.keys(obj).forEach(key => {
                newObj[key.replace(/\s/g, '')] = obj[key];
            });
            return newObj;
        });

        const uploadData = dataWithoutSpaces.filter((data) => data.TrackingID == user.trackingId);

        const mappedData = uploadData.map(item => {
            const totalAmount = item.Revenue * 0.05;
            return {
                userId: user._id,
                category: item.Category,
                name: item.Name,
                ascin: item.ASIN,
                seller: item.Seller,
                trackingId: item.TrackingID,
                shippedDate: item.DateShipped,
                price: item.Price,
                itemShipped: item.ItemsShipped,
                returns: item.Returns,
                revenue: item.Revenue,
                rate: item.Rate,
                totalAmount: totalAmount
            };
        });

        const result = await excelData.insertMany(mappedData);
        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'USER.upload_data', result, req.headers.lang);

    } catch (err) {
        console.log('err(uploadUserData).....', err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}

exports.AllExcelData = async (req, res) => {
    try {
        const { userId } = req.body;

        // Find data based on the userId
        const users = await excelData.find({ userId: userId });

        if (!users || users.length === 0) {
            return sendResponse(res, constants.WEB_STATUS_CODE.NOT_FOUND, constants.STATUS_CODE.FAIL, 'USER.user_not_found', {}, req.headers.lang);
        }

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'USER.getAllExcelData', users, req.headers.lang);
    } catch (err) {
        console.error('Error(AllExcelData)....', err);
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang);
    }
};
