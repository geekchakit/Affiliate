
const { sendResponse } = require('../../services/common.service')
const dateFormat = require('../../helper/dateformat.helper');
const constants = require('../../config/constants');
const User = require('../../models/user.model');
const { LoginResponse } = require('../../ResponseData/user.response');
const JoinedCampaign = require('../../models/joinedCampaign.model')






exports.login = async (req, res) => {

    const { email, password } = req.body;

    try {

        const user = await User.findOne({ email: email, deleted_at: null });

        if (!user)
            return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.invalid_username_password', {}, req.headers.lang);

        if (!user.validPassword(password))
            return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'USER.invalid_username_password', {}, req.headers.lang);

        if (user.user_type !== constants.USER_TYPE.ADMIN)
            return sendResponse(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.FAIL, 'GENERAL.unauthorized_user', {}, req.headers.lang);

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
        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'USER.get_user_auth_token', user, req.headers.lang);
    } catch (error) {
        console.log("err........", error)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}


exports.getAllUsers = async (req, res) => {

    try {

        const userId = req.user._id;
        const { name, email, keyword, userType } = req.query;
        const user = await User.findById(userId);

        if (!user || user.user_type !== constants.USER_TYPE.ADMIN)
            return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'GENERAL.invalid_user', {}, req.headers.lang);

        const query = { user_type: 2 };

        if (name) {
            query.name = { $regex: name, $options: 'i' }; // Case-insensitive regex search for fullname
        }

        if (email) {
            query.email = { $regex: email, $options: 'i' }; // Case-insensitive regex search for email
        }

        if (userType) {
            query.user_type = userType;
        }

        if (keyword) {
            const keywordRegex = new RegExp(keyword, 'i');
            query.$or = [
                { name: keywordRegex },
                { email: keywordRegex }
            ];
        }

        if (name) {
            const nameRegex = new RegExp(name, 'i');
            query.$or = [
                { name: nameRegex },
                { $text: { $search: name } }
            ];
        }

        let usersQuery = User.find();

        if (Object.keys(query).length > 0) {
            usersQuery = usersQuery.where(query);
        }

        const selectFields = '_id email name mobile_number user_type state country city gender date_of_birth is_verify is_upload gender reqBody.gender city country state pancard address adharacard';
        const users = await usersQuery.select(selectFields)
            .lean();

        if (!users || users.length === 0) {
            return sendResponse(res, constants.WEB_STATUS_CODE.NOT_FOUND, constants.STATUS_CODE.FAIL, 'USER.user_not_found', {}, req.headers.lang);
        }

        const totalUser = await User.countDocuments(query);
        const data = {
            totalUser: totalUser,
            users
        };

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'USER.get_all_users', data, req.headers.lang);

    } catch (err) {
        console.error('Error(getAllUsers)....', err);
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang);
    }
};



exports.getAllPendingUsersList = async (req, res) => {

    try {

        const userId = req.user._id;
        const user = await User.findById(userId);
        const { status } = req.query;

        if (!user || user.user_type !== constants.USER_TYPE.ADMIN)
            return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'GENERAL.invalid_user', {}, req.headers.lang);

        const selectFields = '_id status';
        const users = await JoinedCampaign.find({ status }).select(selectFields).populate('userId').populate('campaignId')

        const totalUser = await JoinedCampaign.countDocuments(status);

        let responseData = users.map(data => ({
            totalPendingUser: totalUser,
            _id: data._id,
            status: users.status,
            name: data.userId.name,
            userId: data.userId._id,
            gender: data.userId.gender,
            date_of_birth: data.userId.date_of_birth,
            state: data.userId.state,
            country: data.userId.country,
            city: data.userId.city,
            adharacard: data.userId.adharacard,
            address: data.userId.address,
            pancard: data.userId.pancard,
            user_type: data.userId.user_type,
            is_verify: data.userId.is_verify,
            is_upload: data.userId.is_upload,
            email: data.userId.email,
            campaignId: data.campaignId._id,
            CampaignImage: data.campaignId.CampaignImage,
            campaignName: data.campaignId.campaignName,
            countryName: data.campaignId.countryName,
            commissionName: data.campaignId.commissionName,
            paymentTerm: data.campaignId.paymentTerm,
            conversionRate: data.campaignId.conversionRate,
            confirmationRate: data.campaignId.confirmationRate,

        })) || []

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'USER.all_the_pending_user_list', responseData, req.headers.lang);

    } catch (err) {
        console.error('Error(getAllPendingUsersList)....', err);
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang);
    }
};




exports.userJoinedCampaigned = async (req, res) => {

    try {

        const adminId = req.user._id;
        const user = await User.findById(adminId);
        const { id, trackingId } = req.body;

        if (!user || user.user_type !== constants.USER_TYPE.ADMIN)
            return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'GENERAL.invalid_user', {}, req.headers.lang);

        const selectFields = '_id status';
        const data = await JoinedCampaign.findOneAndUpdate({ _id: id }, {
            $set:
            {
                status: 'joined',
                trackingId: trackingId
            }
        },
            { new: true },
        ).select(selectFields).populate('userId').populate('campaignId')

        let responseData = {
            name: data.userId.name,
            userId: data.userId._id,
            _id: data._id,
            status: data.status,
            gender: data.userId.gender,
            date_of_birth: data.userId.date_of_birth,
            state: data.userId.state,
            country: data.userId.country,
            city: data.userId.city,
            adharacard: data.userId.adharacard,
            address: data.userId.address,
            pancard: data.userId.pancard,
            user_type: data.userId.user_type,
            is_verify: data.userId.is_verify,
            is_upload: data.userId.is_upload,
            email: data.userId.email,
            campaignId: data.campaignId._id,
            CampaignImage: data.campaignId.CampaignImage,
            campaignName: data.campaignId.campaignName,
            countryName: data.campaignId.countryName,
            commissionName: data.campaignId.commissionName,
            paymentTerm: data.campaignId.paymentTerm,
            conversionRate: data.campaignId.conversionRate,
            confirmationRate: data.campaignId.confirmationRate,

        } || {}

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'USER.joined_user', responseData, req.headers.lang);

    } catch (err) {
        console.error('Error(userJoinedCampaigned)....', err);
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang);
    }
};