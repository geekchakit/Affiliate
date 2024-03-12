const {
  validationResult
} = require('express-validator');
const {
  sendResponseValidation
} = require('../services/common.service')
const constants = require('../config/constants')





// show validation error message
exports.validatorFunc = (req, res, next) => {
  let errArray = {};
  const errors = validationResult(req);
  console.log("errors.....",errors)
  if (!errors.isEmpty()) {
    return sendResponseValidation(res, constants.WEB_STATUS_CODE.BAD_REQUEST, constants.STATUS_CODE.VALIDATION, errors.array()[0].msg, {}, req.headers.lang);
  }
  next();
};



