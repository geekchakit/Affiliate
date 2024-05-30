const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define referral schema
const referralSchema = new Schema({
    referee: { 
        type: Schema.Types.ObjectId, 
        ref: 'users',
        required: true 
    }, // Referred user
    refereeCode: { 
        type: String,
        required: true 
    }, // Referral code of the referred user
    referrer: { 
        type: Schema.Types.ObjectId, 
        ref: 'users',
        required: false 
    }, // Referring user
    referrerCode: { 
        type: String,
        required: false 
    }, // Referral code of the referring user
    createdAt: { 
        type: Date, 
        default: Date.now 
    }, // Timestamp of when the referral occurred
});

// Define referral model
const Referral = mongoose.model('referrals', referralSchema);

module.exports = Referral;
