
const express = require('express');
const { requestWithdrawl, updateWithdrawlRequest, approveOrder,getWithdrawlRequests,getTotalBalance } = require('../controllers/payment.controller');
const upload = require('../../middleware/multer');
const router = express.Router();

router.post('/requestWithdrawl',upload.single('invoice'),requestWithdrawl);
router.put('/updateWithdrawlRequest', updateWithdrawlRequest);
router.post('/approveOrder', approveOrder);
router.get('/getWithdrawlRequests/:userId', getWithdrawlRequests);
router.get('/getTotalBalance/:userId', getTotalBalance);

module.exports = router;