const mongoose = require("mongoose");

const campaginSchema = new mongoose.Schema({
  campaignName: {
    type: String,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
  },
  campaignRequest: {
    type: String,
    enum: ["pending", "joined", "request"],
  },
  countryName: {
    type: String,
  },
  commissionName: {
    type: String,
  },
  paymentTerm: {
    type: String,
  },
  conversionRate: {
    type: String,
  },
  confirmationRate: {
    type: String,
  },
  usersList: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null,
      },
      status: {
        type: String,
        enum: ["pending", "joined", "requested"],
      },
      trackingId:{
        type: String,
      }
    },
  ],
  created_at: {
    type: String,
  },
  isFavourite: {
    type: Boolean,
    default: false,
  },
  CampaignImage: {
    type: String,
    default: null,
  },
  updated_at: {
    type: String,
  },
  deleted_at: {
    type: String,
    default: null,
  },
});

const Campaign = mongoose.model("campaigns", campaginSchema);
module.exports = Campaign;
