
const express = require('express');
const { model } = require('mongoose');
const authenticate = require('../../middleware/authenticate');
const { addTax, getAllTax, updateTax, deleteTax } = require('../controllers/tax.controller');
const router = express.Router();



router.post('/addNewTax', addTax)
router.get('/getAllTax/:userId/:limit', getAllTax)
router.put('/updateTax/:taxId', updateTax)
router.delete('/deleteTax/:taxId', deleteTax)



module.exports = router;