

const mongoose = require('mongoose');

// Define schema for the entity
const billingSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    name: {
        type: String
    },
    pan_number: {
        type: String
    },
    entity_type: {
        type: String
    },
    entity: {
        type: String,
        enum: ['Individual', 'Company']
    },
    country: {
        type: String
    },
    currency: {
        type: String,
    },
    account_owner_name: {
        type: String
    },
    bank_name: {
        type: String
    },
    account_number: {
        type: String,
    },
    ifsc:{
        type: String
    },
    bis_swift_code:{
        type: String
    },
    ref_id: {
        type: String
    },
    created_at: {
        type: String
    },
    updated_at: {
        type: String
    }
});


//Output data to JSON
billingSchema.methods.toJSON = function () {
    const billing = this;
    const billingObject = billing.toObject();
    return billingObject;
};


const Billing = mongoose.model('billings', billingSchema);
module.exports = Billing;
