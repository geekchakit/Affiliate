

const mongoose = require('mongoose');


const JoinedcampaginSchema = new mongoose.Schema({

    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'joined']
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'campaign',
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    trackingId: {
        type: String,
        default: null
    },
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


const JoinedCampaign = mongoose.model('joinedcampaigns', JoinedcampaginSchema);
module.exports = JoinedCampaign;