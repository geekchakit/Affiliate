const mongoose = require('mongoose');

// Define schema for the withdrawal request
const withdrawalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    type: {
        type: String,
        required: false
    },
    billingId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'billings',
        required: true
    },
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"campaigns",
        required: false
    },
    amount: {
        type: Number,
        required: true
    },
    invoiceNumber: {
        type: String,
        required: true
    },
    file: {
        type: String, // Assuming the file will be stored as a URL or file path
        required: true
    },
    status: {
        type: String,
        enum: ['requested', 'approved', 'rejected', 'completed'],
        default: 'requested'
    },
    statusMessage: {
        type: String,
        default: ''
    },
    utrNumber: {
        type: String,
        default: ''
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

const Withdrawal = mongoose.model('withdrawals', withdrawalSchema);
module.exports = Withdrawal;
