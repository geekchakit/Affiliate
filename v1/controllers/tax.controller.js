
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





exports.addTax = async (req, res) => {

    try {

        const reqBody = req.body;
        reqBody.created_at = await dateFormat.set_current_timestamp();
        reqBody.updated_at = await dateFormat.set_current_timestamp();
        reqBody.ref_id = uuid()
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
            user_id: addTaxs.userId,
            created_at: addTaxs.created_at
        }

        return sendResponse(res, constants.WEB_STATUS_CODE.CREATED, constants.STATUS_CODE.SUCCESS, 'TAX.add_tax', data, req.headers.lang);

    } catch (err) {
        console.log("err(addTax)......", err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}



exports.getAllTax = async (req, res) => {

    try {

        let { limit,userId } = req.params;
        limit = limit ? parseInt(limit) : 10;
        console.log("userId......",userId);

        const selectFields = '_id name type_of_entity state pancard country city ref_id address zipcode';
        const alltheTaxList = await Tax.find({ userId: userId }).limit(limit).sort().populate('userId', 'name email _id').select(selectFields)

        if (!alltheTaxList || alltheTaxList.length === 0)
            return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'TAX.tax_not_found', [], req.headers.lang);


        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'TAX.get_all_tax', alltheTaxList, req.headers.lang);

    } catch (err) {
        console.log("err(getAllTax)......", err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}


exports.updateTax = async (req, res, next) => {

    try {

        const reqBody = req.body
        const { taxId } = req.params;
        console.log(req.body);
        console.log(taxId);
        const addTaxs = await Tax.findOneAndUpdate({ _id: taxId }, reqBody, { new: true });
        addTaxs.updated_at = await dateFormat.set_current_timestamp();
        await addTaxs.save();

        if (!addTaxs)
            return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'TAX.tax_not_found', {}, req.headers.lang);

        const data = {
            tax_id: addTaxs._id,
            name: addTaxs.name,
            type_of_entity: addTaxs.type_of_entity,
            pancard: addTaxs.pancard,
            country: addTaxs.country,
            city: addTaxs.city,
            ref_id: addTaxs.ref_id,
            address: addTaxs.address,
            state: addTaxs.state,
            zipcode: addTaxs.zipcode,
            created_at: addTaxs.created_at
        }

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'TAX.update_tax', data, req.headers.lang);

    } catch (err) {
        console.log("err(updateTax)......", err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}



exports.deleteTax = async (req, res, next) => {

    try {
        const { taxId } = req.params;
        const addTaxs = await Tax.findOneAndDelete({ _id: taxId });

        if (!addTaxs)
            return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'TAX.tax_not_found', {}, req.headers.lang);

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'TAX.delete_tax', addTaxs, req.headers.lang);

    } catch (err) {
        console.log("err(deleteTax)......", err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}