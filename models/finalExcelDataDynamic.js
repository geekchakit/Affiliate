const mongoose = require('mongoose');

const getFinalExcelDataModel = (userId) => {
  const modelName = "FinalExcelData_"+userId;

  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }

  const finalExcelSchema = new mongoose.Schema({
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'campaigns',
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
    totalAmount: Number,
    isWithdrawl:{
        type:Boolean,
        default:false
    }
  });

  return mongoose.model(modelName, finalExcelSchema);
};

module.exports = getFinalExcelDataModel;