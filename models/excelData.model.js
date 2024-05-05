
const mongoose = require('mongoose');
const Campaign = require('./campaign.model');


const excelSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    CampaignId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign'
    },
    category: String,
    name: String,
    ascin: String,
    seller: String,
    trackingId: String,
    shippedDate: String,
    price: Number,
    itemShipped: Number,
    returns: Number,
    revenue: Number,
    rate: Number,
    amount: Number,
    date: String,
    totalAmount:Number
});

const excelData = mongoose.model('excelData', excelSchema);
module.exports = excelData;