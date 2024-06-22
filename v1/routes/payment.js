
const express = require('express');
const { requestWithdrawl, updateWithdrawlRequest, approveOrder,getWithdrawlRequests } = require('../controllers/payment.controller');
const upload = require('../../middleware/multer');
const router = express.Router();

router.post('/requestWithdrawl',upload.single('image'),requestWithdrawl);
router.put('/updateWithdrawlRequest', updateWithdrawlRequest);
router.post('/approveOrder', approveOrder);
router.get('/getWithdrawlRequests/:userId', getWithdrawlRequests);

module.exports = router;