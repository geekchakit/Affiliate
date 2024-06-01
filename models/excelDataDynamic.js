// excelData.model.js
const mongoose = require('mongoose');

const getExcelDataModel = (userId) => {
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

return mongoose.model('excelData_' + userId+"s", excelSchema);
};

module.exports = getExcelDataModel;