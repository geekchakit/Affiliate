
const mongoose = require('mongoose');

// Define schema for the entity
const ratemodulechema = new mongoose.Schema({
    categoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
    },
    rate: {
        type: Number
    },
    fromData:{
        type: String
    },
    toData:{
        type: String
    },
});

const RateModule = mongoose.model('ratemodule', ratemodulechema);
module.exports = RateModule;
