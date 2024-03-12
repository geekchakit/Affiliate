

const { body, validationResult } = require('express-validator');


exports.user_validator = [


  body('email')
    .not()
    .isEmpty()
    .withMessage('email is required')
    .isString()
    .withMessage('email should be string')
    .isEmail()
    .withMessage('please enter a valid email')
    .trim(),

  body('password')
    .not()
    .isEmpty()
    .withMessage('password is required')
    .isString()
    .withMessage('password should be string')
    .trim()
    .isLength({ min: 8 })
    .withMessage('password length is 8 characters'),

  body('full_name')
    .not()
    .isEmpty()
    .withMessage('full_name is required')
    .trim()
    .isString()
    .withMessage('full_name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage('full_name size is 2 to 20 characters'),

  body('mobile_number')
    .not()
    .isEmpty()
    .withMessage('mobile_number is required')
    .isString().withMessage('mobile_number should be a string')
    .isMobilePhone().withMessage('please enter a valid mobile_number address')
    .trim(),

];

exports.login_validator = [

  body('email')
    .not()
    .isEmpty()
    .withMessage('email is required')
    .isString()
    .withMessage('email should be string')
    .isEmail()
    .withMessage('please enter a valid email')
    .trim(),

  body('password')
    .not()
    .isEmpty()
    .withMessage('password is required')
    .isString()
    .withMessage('password should be string')
    .trim()
    .isLength({ min: 8 })
    .withMessage('password length is 8 characters'),
]




exports.ValidatorResult = (req, res, next) => {

  try {

    const result = validationResult(req);
    const haserror = !result.isEmpty();

    if (haserror) {
      const err = result.array()[0].msg;
      return res.status(400).send({ sucess: false, message: err });
    }
    next();

  } catch (err) {

    res.status(false).send({ status: false, message: err.message })
  }
}