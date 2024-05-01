
const express = require('express');
const { model } = require('mongoose');
const authenticate = require('../../middleware/authenticate');
const { addTax, getAllTax, updateTax, deleteTax } = require('../controllers/tax.controller');
const router = express.Router();



router.post('/addNewTax', authenticate, addTax)
router.get('/getAllTax', authenticate, getAllTax)
router.put('/updateTax/:taxId', authenticate, updateTax)
router.delete('/deleteTax/:taxId', authenticate, deleteTax)



module.exports = router;