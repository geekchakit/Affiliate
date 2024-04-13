
const express = require('express');
const { model } = require('mongoose');
const authenticate = require('../../middleware/authenticate');
const { addTax } = require('../controllers/tax.controller');
const router = express.Router();




router.post('/addNewTax' , authenticate , addTax)



module.exports = router;