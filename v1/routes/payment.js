
const express = require('express');
const { requestWithdrawl, updateWithdrawlRequest, approveOrder,getWithdrawlRequests,getTotalBalance,getWithdrawalRequestsForAdmin } = require('../controllers/payment.controller');
const upload = require('../../middleware/multer');
const router = express.Router();

router.post('/requestWithdrawl',upload.single('invoice'),requestWithdrawl);
router.get('/getWithdrawalRequestsForAdmin/:status', getWithdrawalRequestsForAdmin);
router.put('/updateWithdrawlRequest', updateWithdrawlRequest);
router.post('/approveOrder', approveOrder);
router.get('/getWithdrawlRequests/:userId', getWithdrawlRequests);
router.get('/getTotalBalance/:userId', getTotalBalance);

module.exports = router;