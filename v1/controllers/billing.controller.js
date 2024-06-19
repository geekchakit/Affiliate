
const {
    sendResponse
} = require('../../services/common.service')
const dateFormat = require('../../helper/dateformat.helper');
const User = require('../../models/user.model')
const Keys = require('../../keys/keys')
const constants = require('../../config/constants')
const Billing = require('../../models/billing.model');
const { v4: uuid } = require('uuid');




exports.addBill = async (req, res) => {

    try {

        const reqBody = req.body;
        reqBody.created_at = await dateFormat.set_current_timestamp();
        reqBody.updated_at = await dateFormat.set_current_timestamp();
        reqBody.ref_id = uuid()
        reqBody.userId = reqBody.userId;
        const addBill = await Billing.create(reqBody);

        const data = {
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
            created_at: addBill.created_at
        }

        return sendResponse(res, constants.WEB_STATUS_CODE.CREATED, constants.STATUS_CODE.SUCCESS, 'BILL.add_bill', data, req.headers.lang);

    } catch (err) {
        console.log("err(addBill)......", err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}



exports.getAllBill = async (req, res, next) => {

    try {

        
        const userId = req.params.userId;
        let { limit } = req.params.limit;
        limit = limit ? parseInt(limit) : 10;

        const selectFields = '_id name pan_number entity_type entity country currency account_owner_name bank_name account_number ref_id ifsc bis_swift_code'
        const alltheBilList = await Billing.find({ userId: userId }).limit(limit).sort().populate('userId', 'name email _id').select(selectFields)

        if (!alltheBilList || alltheBilList.length === 0)
            return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'BILL.bill_not_found', [], req.headers.lang);


        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'BILL.get_all_bill', alltheBilList, req.headers.lang);

    } catch (err) {
        console.log("err(getAllBill)......", err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}


exports.updateBill = async (req, res, next) => {

    try {

        const reqBody = req.body;
        const { billId } = req.params;
        console.log("billId......", billId)
        const addBill = await Billing.findOneAndUpdate({ _id: billId }, reqBody, { new: true });
        addBill.updated_at = await dateFormat.set_current_timestamp();
        await addBill.save();

        if (!addBill)
            return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'BILL.bill_not_found', {}, req.headers.lang);

        const data = {
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
            created_at: addBill.created_at
        }

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'BILL.update_bill', data, req.headers.lang);

    } catch (err) {
        console.log("err(updateBill)......", err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}



exports.deleteBill = async (req, res, next) => {

    try {
        const { billId } = req.params;
        const addBill = await Billing.findOneAndDelete({ _id: billId });

        if (!addBill)
            return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'BILL.bill_not_found', {}, req.headers.lang);

        return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'BILL.delete_bill', addBill, req.headers.lang);

    } catch (err) {
        console.log("err(deleteBill)......", err)
        return sendResponse(res, constants.WEB_STATUS_CODE.SERVER_ERROR, constants.STATUS_CODE.FAIL, 'GENERAL.general_error_content', err.message, req.headers.lang)
    }
}