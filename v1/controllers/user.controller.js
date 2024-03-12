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
    getUser,
    Usersave,
} = require('../services/user.service');
const Keys = require('../../keys/keys')
const constants = require('../../config/constants')
const {
    JWT_SECRET
} = require('../../keys/keys');
const { v4: uuid } = require('uuid');
const { LoginResponse, signUpResponse } = require('../../ResponseData/user.response')




exports.signUp = async (req, res, next) => {

    try {

        const reqBody = req.body

        const checkMail = await isValid(reqBody.email)
        if (checkMail == false) 
        return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'GENERAL.blackList_mail', {}, req.headers.lang);

        const existEmail = await User.findOne({email: reqBody.email});
        if(existEmail)
        return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.already_exist', {}, req.headers.lang);

        reqBody.password = await bcrypt.hash(reqBody.password, 10);
        reqBody.created_at = await dateFormat.set_current_timestamp();
        reqBody.updated_at = await dateFormat.set_current_timestamp();
        reqBody.tempTokens = await jwt.sign({
            data: reqBody.email
        }, JWT_SECRET, {
            expiresIn: constants.URL_EXPIRE_TIME
        })

        reqBody.IdNumber = uuid()
        reqBody.device_type = (reqBody.device_type) ? reqBody.device_type : null
        reqBody.device_token = (reqBody.device_token) ? reqBody.device_token : null
        const user = await Usersave(reqBody);
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

        if (user == 1) return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.email_not_found', {}, req.headers.lang);
        if (user == 2) return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.invalid_password', {}, req.headers.lang);

        if (user.status == 0) return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.inactive_account', {}, req.headers.lang);
        if (user.status == 2) return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.deactive_account', {}, req.headers.lang);
        if (user.deleted_at != null) return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.inactive_account', {}, req.headers.lang);

        let newToken = await user.generateAuthToken();
        let refreshToken = await user.generateRefreshToken()

        user.device_type = (reqBody.device_type) ? reqBody.device_type : null
        user.device_token = (reqBody.device_token) ? reqBody.device_token : null

        await user.save();

        let users = LoginResponse(user)

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'USER.login_success', users, req.headers.lang);

    } catch (err) {
        console.log('err(login).....', err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}

