const mongoose = require('mongoose');

const referralSaleSchema = new mongoose.Schema({
    referrer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    }, // Referring user (referrer)
    referee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    }, // Referred user (referee)
    referrerCode: {
        type: String,
        required: true
    }, // Referral code of the referrer
    refereeCode: {
        type: String,
        required: true
    }, // Referral code of the referred user
    saleAmount: {
        type: Number,
        required: true
    }, // Amount of the sale made by the referred user
    commissionEarned: {
        type: Number,
        required: true
    }, // Commission earned by the referrer for this sale
    saleDate: {
        type: Date,
        default: Date.now
    } // Date of the sale
});

const ReferralSale = mongoose.model('referralSale', referralSaleSchema);
module.exports = ReferralSale;
