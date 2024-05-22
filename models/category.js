
const mongoose = require('mongoose');

// Define schema for the entity
const CategorySchema = new mongoose.Schema({
    categoryName:{
        type: String
    },
    defaultRate:{
        type:Number,
        default:8
    },
    campignId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'campaigns'
    }
});

const Category = mongoose.model('categorys', CategorySchema);
module.exports = Category;
