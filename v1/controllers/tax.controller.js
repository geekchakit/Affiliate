
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
const Tax = require('../../models/tax.model');
const { v4: uuid } = require('uuid');





exports.addTax = async (req, res, next) => {

    try {

        const reqBody = req.body
        const userId = req.user._id;
        const users = await User.findById(userId);

        if (!users || users.user_type !== constants.USER_TYPE.USER)
            return sendResponse(res, constants.WEB_STATUS_CODE.UNAUTHORIZED, constants.STATUS_CODE.UNAUTHENTICATED, 'USER.invalid_user', {}, req.headers.lang);

        reqBody.created_at = await dateFormat.set_current_timestamp();
        reqBody.updated_at = await dateFormat.set_current_timestamp();
        reqBody.ref_id = uuid()
        reqBody.userId = userId;
        const addTaxs = await Tax.create(reqBody);

        const data = {
            tax_id: addTaxs._id,
            name: addTaxs.name,
            type_of_entity: addTaxs.type_of_entity,
            pancard: addTaxs.pancard,
            country: addTaxs.country,
            city: addTaxs.city,
            ref_id: addTaxs.ref_id,
            address: addTaxs.address,
            zipcode: addTaxs.zipcode,
            created_at: addTaxs.created_at
        }

        return sendResponse(res, constants.WEB_STATUS_CODE.CREATED, constants.STATUS_CODE.SUCCESS, 'TAX.add_tax', data, req.headers.lang);

    } catch (err) {
        console.log("err(addTax)......", err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}