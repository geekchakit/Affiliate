const mongoose = require('mongoose');
const { request } = require('../app');

// Define schema for the account
const accountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    campaigns: [
        {
            campaignId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'campaigns', // Assuming you have a campaigns collection
                required: true
            },
            amount: {
                type: Number,
                required: true
            }
        }
    ],
    totalAmount: {
        type: Number,
        default: 0
    },
    requestedAmount: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

const Account = mongoose.model('accounts', accountSchema);
module.exports = Account;
