const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const constants = require('../config/constants')
const { sendResponse } = require('../services/common.service');
const { JWT_SECRET } = require('../keys/keys')



//authenticate user
let authenticate = async (req, res, next) => {
    try {

        if (!req.header('Authorization')) return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'GENERAL.unauthorized_user', {}, req.headers.lang);

        const token = req.header('Authorization').replace('Bearer ', '');
        if (!token) sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'GENERAL.not_token', {}, req.headers.lang)

        let decoded;
        try {
            decoded = await jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'GENERAL.token_expired', {}, req.headers.lang);
        }

        const user = await User.findOne({ _id: decoded._id, 'tokens': token }).lean();

        if (!user) return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'GENERAL.unauthorized_user', {}, req.headers.lang)
        // if (user.verify_token == false) return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL , 'USER.not_verify_account', {}, req.headers.lang);
        if (user.status == 0) return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'USER.inactive_account', {}, req.headers.lang);
        if (user.status == 2) return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'USER.deactive_account', {}, req.headers.lang);
        if (user.deleted_at != null) return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'USER.delete_account', {}, req.headers.lang);
        // if (user.status == 0) return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.inactive_account', {}, req.headers.lang);
        // if (user.status == 2) return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.deactive_account', {}, req.headers.lang);
        // if (user.deleted_at != null) return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.delete_account', {}, req.headers.lang);

        req.token = token;
        req.user = user;

        next();
    } catch (err) {
        console.log(err)
        sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}

module.exports = authenticate;