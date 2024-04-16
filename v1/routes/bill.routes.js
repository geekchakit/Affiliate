
const express = require('express');
const { addBill, getAllBill, updateBill, deleteBill } = require('../controllers/billing.controller');
const router = express.Router();
const authenticate = require('../../middleware/authenticate')



router.post('/addNewBill' , authenticate , addBill)
router.get('/getAllBill' , authenticate , getAllBill)
router.put('/updateBill/:billId' , authenticate , updateBill)
router.delete('/deleteBill/:billId' , authenticate , deleteBill)

module.exports = router;