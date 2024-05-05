const { name } = require('ejs');
const mongoose = require('mongoose');

const excelHeaderSchema = new mongoose.Schema({
    name:{
        type:String
    }
});

const ExcelHeaders = mongoose.model('excelheaders', excelHeaderSchema);
module.exports = ExcelHeaders;