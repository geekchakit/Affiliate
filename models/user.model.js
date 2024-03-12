const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const _ = require('lodash');
const constants = require('../config/constants');
const dateFormat = require('../helper/dateformat.helper');
const {
    JWT_SECRET
} = require('../keys/keys')

const Schema = mongoose.Schema;

//Define user schema
const userSchema = new Schema({

    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    full_name: {
        type: String,
        default: null
    },
    password: {
        type: String,
        minlength: 8,
    },
    mobile_number: {
        type: String
    },
    userName: {
        type: String,
    },
    campaign: {
        type: String
    },
    idNumber: {
        type: String
    },
    country: {
        type: String
    },
    user_type: {
        type: Number, //1-admin 2-user
        default: 2
    },
    status: {
        type: Number,
        default: constants.STATUS.ACTIVE
    },
    signup_status: {
        type: Number,
        default: 1 //
    },
    is_verify: {
        type: Boolean,
        default: false
    },
    device_token: {
        type: String,
        default: null
    },
    device_type: {
        type: Number,
        default: null  // 'ANDROID' : 1,	'IOS' : 2,
    },
    tokens: {
        type: String
    },
    refresh_tokens: {
        type: String
    },
    tempTokens: {
        type: String
    },
    created_at: {
        type: String,
    },
    updated_at: {
        type: String,
    },
    deleted_at: {
        type: String,
    },
});

userSchema.index({
    "email": 1
});

//Checking if password is valid
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

//Output data to JSON
userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    return userObject;
};

//Checking for user credentials
userSchema.statics.findByCredentials = async function (email, password, user_type) {

    const user = await User.findOne({
        $or: [{ email: email }, { user_name: email }],
        user_type: user_type,
        deleted_at: null
    });

    if (!user) {
        return 1
    }

    if (!user.validPassword(password)) {
        return 2
    }

    return user;
}

//Generating auth token
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = await jwt.sign({
        _id: user._id.toString()
    }, JWT_SECRET, { expiresIn: '24h' })
    // user.tokens = user.tokens.concat({
    //     token
    // });
    user.tokens = token
    user.updated_at = await dateFormat.set_current_timestamp();
    user.refresh_tokens_expires = await dateFormat.add_time_current_date(1, 'days')
    await user.save()
    return token
}

userSchema.methods.generateRefreshToken = async function () {
    const user = this;
    const refresh_tokens = await jwt.sign({
        _id: user._id.toString()
    }, JWT_SECRET)

    user.refresh_tokens = refresh_tokens
    user.updated_at = await dateFormat.set_current_timestamp();
    await user.save()
    return refresh_tokens
}

//Define user model
const User = mongoose.model('users', userSchema);
module.exports = User;