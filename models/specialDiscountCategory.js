const mongoose = require('mongoose');

const specialDiscountCategorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true
    },
    categoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
    },
    campaignId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'campaigns'
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    rate:{
        type:Number,
        require:true
    },
    startDate:{
        type: Date,
        required: true
    },
    endDate:{
        type: Date,
        required: true
    },
    isActive:{
        type: Boolean,
        default: true
    }
});

const SpecialDiscountCategory = mongoose.model('specialDiscountCategory', specialDiscountCategorySchema);
module.exports = SpecialDiscountCategory;