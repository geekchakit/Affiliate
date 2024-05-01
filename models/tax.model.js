
const mongoose = require('mongoose');

// Define schema for the entity
const taxSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    name: {
        type: String
    },
    type_of_entity: {
        type: String
    },
    pancard: {
        type: String
    },
    country: {
        type: String
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    ref_id: {
        type: String
    },
    address: {
        type: String,
    },
    zipcode: {
        type: Number
    },
    created_at: {
        type: String
    },
    updated_at: {
        type: String
    }
});


//Output data to JSON
taxSchema.methods.toJSON = function () {
    const tax = this;
    const taxObject = tax.toObject();
    return taxObject;
};


const Tax = mongoose.model('taxs', taxSchema);
module.exports = Tax;
