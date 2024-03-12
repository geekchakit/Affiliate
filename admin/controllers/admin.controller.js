
const { sendResponse } = require('../../services/common.service')
const dateFormat = require('../../helper/dateformat.helper');
const constants = require('../../config/constants');
const User = require('../../models/user.model');
const { LoginResponse } = require('../../ResponseData/user.response');





exports.login = async (req, res) => {

    const { email, password } = req.body;

    try {

        const user = await User.findOne({ email: email, deleted_at: null });

        if (!user) {
            return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.invalid_username_password', {}, req.headers.lang);
        }
        if (!user.validPassword(password)) {
            return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.invalid_username_password', {}, req.headers.lang);
        }
        if (user.user_type !== constants.USER_TYPE.ADMIN) {
            return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'GENERAL.unauthorized_user', {}, req.headers.lang);
        }

        await user.generateAuthToken();
        await user.generateRefreshToken();

        let users = LoginResponse(user)

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'USER.login_success', users, req.headers.lang);

    } catch (err) {
        console.log("err(adminLogin)........", err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}


exports.logout = async (req, res) => {

    try {

        const reqBody = req.user
        let UserData = await User.findById(reqBody._id)

        UserData.tokens = null
        UserData.refresh_tokens = null

        await UserData.save()

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'USER.logout_success', {}, req.headers.lang);

    } catch (err) {
        console.log("err(adminLogout)........", err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}


exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body

        const user = await verifyRefreshToken(refreshToken)
        if (!user) sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'GENERAL.unauthorized_user', {}, req.headers.lang)

        await user.generateAuthToken();
        await user.generateRefreshToken();
        sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'USER.get_user_auth_token', user, req.headers.lang);
    } catch (error) {
        console.log("err........", error)
        sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}


exports.getAllUsers = async (req, res) => {

    try {

        const userId = req.user._id;
        const { page = 1, limit = 10, username, country, email, mobileNumber } = req.query;
        const user = await User.findById(userId);

        if (user.user_type !== constants.USER_TYPE.ADMIN)
            return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.FAIL, 'GENERAL.unauthorized_user', {}, req.headers.lang);

        if (parseInt(page) < 1 || parseInt(limit) < 1)
            return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'PUJA.Invalid_page', {}, req.headers.lang);

        const query = {};

        if (username) {
            query.userName = username;
        }

        if (email) {
            query.email = email;
        }

        if (country) {
            query.country = country;
        }

        if (mobileNumber) {
            query.mobile_number = mobileNumber;
        }

        let usersQuery = User.find({ user_type: 2 }); 

        if (Object.keys(query).length > 0) {
            usersQuery = usersQuery.where(query);
        }

        const selectFields = '_id email full_name mobile_number userName user_type idNumber campagin country created_at updated_at';
        const users = await usersQuery.select(selectFields)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .lean();

        if (!users || users.length === 0) {
            return sendResponse(res, constants.WEB_STATUS_CODE.NOT_FOUND, constants.STATUS_CODE.FAIL, 'USER.user_not_found', {}, req.headers.lang);
        }

        const totalUser = await User.countDocuments(query);
        const data = {
            page: parseInt(page),
            totalUser: totalUser,
            users
        };

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'USER.get_all_users', data, req.headers.lang);
    } catch (err) {
        console.error('Error(getAllUsers)....', err);
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang);
    }
};
