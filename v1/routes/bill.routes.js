
const express = require('express');
const { addBill, getAllBill, updateBill, deleteBill } = require('../controllers/billing.controller');
const router = express.Router();
const authenticate = require('../../middleware/authenticate')



router.post('/addNewBill', addBill)
router.get('/getAllBill/:userId/:limit' , getAllBill)
router.put('/updateBill/:billId' , updateBill)
router.delete('/deleteBill/:billId' , deleteBill)

module.exports = router;