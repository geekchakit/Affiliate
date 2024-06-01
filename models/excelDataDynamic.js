const mongoose = require('mongoose');

const getExcelDataModel = (userId) => {
  const modelName = "ExcelData_"+userId;

  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }

  const excelSchema = new mongoose.Schema({
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
  });

  return mongoose.model(modelName, excelSchema);
};

module.exports = getExcelDataModel;