

const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const constants = require('../config/constants')
const { sendResponse } = require('../services/common.service');
const { JWT_SECRET } = require('../keys/keys')



module.exports = {

    verifyAccessToken: async (req, res, next) => {

        try {
            console.log("Authorization....", req.header('Authorization'));
            if (!req.header('Authorization')) return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'GENERAL.unauthorized_user', {}, req.headers.lang);
            
            const token = req.header('Authorization').replace('Bearer ', '');
            if (!token) sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'GENERAL.not_token', {}, req.headers.lang)

            let decoded;
            try {
                decoded = await jwt.verify(token, JWT_SECRET);
            } catch (error) {
                return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'GENERAL.token_expired', {}, req.headers.lang);
            }
            const user = await User.findOne({ _id: decoded._id, 'tokens': token, user_type: 1 });

            if (!user) return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'GENERAL.unauthorized_user', {}, req.headers.lang)

            req.token = token;
            req.user = user;

            next();

        } catch (err) {
            console.log('err....', err)
            sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
        }
    },
    verifyRefreshToken: async (refreshToken) => {
        try {
            const decoded = await jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
            console.log("decoded....", decoded);

            const user = await User.findOne({ _id: decoded._id });
            if (!user) return false;
            return user;
        } catch (err) {
            console.log('err....', err)
            sendResponse(constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
        }
    }
}