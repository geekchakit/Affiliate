
const mongoose = require('mongoose');



const campaginSchema = new mongoose.Schema({

    campaignName: {
        type: String,
    },
    status: {
        type: String,
        enum: ['active', 'inactive']
    },
    countryName: {
        type: String,
    },
    commissionName: {
        type: String,
    },
    paymentTerm: {
        type: String
    },
    conversionRate: {
        type: String
    },
    confirmationRate: {
        type: String
    },
    userId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null
    }],
    created_at: {
        type: String
    },
    updated_at: {
        type: String
    },
    deleted_at: {
        type: String,
        default: null
    }
})


const Campaign = mongoose.model('campaign', campaginSchema);
module.exports = Campaign;