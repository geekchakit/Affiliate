const Withdrawal = require('../../models/withdrawl.model');
const User = require('../../models/user.model');
const message = require('../../lang/en/message');
const getFinalExcelDataModel = require("../../models/finalExcelDataDynamic");
const Category = require("../../models/category");
const SpecialDiscountCategory = require("../../models/specialDiscountCategory");
const Account = require("../../models/account.model");

//api for requesting withdrawl
module.exports.requestWithdrawl = async (req, res) => {
    try {
        const { userId, type, campaign, amount, invoiceNumber,file, statusMessage,billingId } = req.body;
        // const files = req.file;
        // console.log("files", files);
        //const file = `${BASEURL}/uploads/${files.filename}`;
        console.log("req.body........", req.body);
        const availableBalance = await Account.findOne({ userId: userId });
        console.log("availableBalance........", availableBalance);
        if(availableBalance.requestedAmount + amount > availableBalance.totalAmount){
            return res.json({
                message: "Requested amount is greater than available balance",
                success: false
            });
        }
        if (availableBalance.totalAmount < amount) {
            return res.json({
                message: "Insufficient balance",
                success: false
            });
        }
        else {
            const newWithdrawal = new Withdrawal({
                userId,
                type,
                campaign,
                amount,
                invoiceNumber,
                file,
                billingId,
                statusMessage
            });

            await newWithdrawal.save();
            availableBalance.requestedAmount += amount;
            await availableBalance.save();
            res.json({
                message: "Requested Succesfully Withdrawal",
                success: true,
                data: newWithdrawal
            })
        }
    } catch (err) {
        console.log("err(createWithdrawal)......", err);
        res.json({
            message: "An error occured while requesting withdrawl"
        });
    }
};

// admin will update the request like approvee reject
module.exports.updateWithdrawlRequest = async (req, res) => {
const { userId, withdrawlId, statusMessage, status,utrNumber } = req.body;
    try {
        const withdrawl = await Withdrawal.findOne({ _id: withdrawlId });
        const account = await Account.findOne({ userId: userId });
        if (!withdrawl) {
            return res.json({
                message: "Withdrawl request not found",
                success: false
            });
        }
        
        //Amount transfered to users account and status updated
        if(status === "completed"){
            withdrawl.utrNumber = utrNumber;
        };

        withdrawl.statusMessage = statusMessage;
        withdrawl.status = status;
        await withdrawl.save();

        // Update the account with the new commission amount by subtracting the requested amount from available balance
        if (status === "approved") {
            account.totalAmount -= withdrawl.amount;
            account.requestedAmount -= withdrawl.amount;
            await account.save();
        }
        // Update the account with by susbtracting the requested amount for requestedamount
        if (status === "rejected") {
            account.requestedAmount -= withdrawl.amount;
            await account.save();
        }
        res.json({
            message: "Withdrawl request updated successfully",
            success: true
        });
    } catch (err) {
        console.log("err(updateWithdrawlRequest)......", err);
        res.json({
            message: "An error occured while updating withdrawl request",
            success: false
        });
    }
};

// admin will approve excel data orders then i will be ready to be withdrawl or abbount will be added to user accounts table.
module.exports.approveOrder = async (req, res) => {
    try {
        const { userId, excelDataId, campaignId } = req.body;

        // Get the dynamic model for the user
        const FinalExcelData = getFinalExcelDataModel(userId);

        // Find the Excel data entry
        const excelDataEntry = await FinalExcelData.findOne({ _id: excelDataId });

        if (!excelDataEntry) {
            return sendResponse(res, constants.WEB_STATUS_CODE.OK, constants.STATUS_CODE.SUCCESS, 'ORDER.excel_data_not_found', {}, req.headers.lang);
        }

        // Check if it is already withdrawn
        if (excelDataEntry.isWithdrawl) {
            res.json({ message: 'Order is already withdrawn', success: false });
        }

        // Calculate the commission
        const revenue = excelDataEntry.revenue || 0;
        const categoryName = excelDataEntry.category;

        let commissionRate;
        const category = await Category.findOne({ categoryName: categoryName, campaignId: campaignId });

        if (category) {
            const categoryId = category._id;
            const specialDiscount = await SpecialDiscountCategory.findOne({
                categoryId: categoryId,
                campaignId: campaignId,
                startDate: { $lte: excelDataEntry.shippedDate },
                endDate: { $gte: excelDataEntry.shippedDate },
                isActive: true
            });

            if (specialDiscount) {
                commissionRate = specialDiscount.rate;
            } else {
                commissionRate = category.defaultRate;
            }
        }

        const commission = (commissionRate && revenue) ? (revenue * (commissionRate / 100)) : 0;

        // Update the Excel data entry to mark it as withdrawn
        excelDataEntry.isWithdrawl = true;
        await excelDataEntry.save();

        // Find the user's account
        let account = await Account.findOne({ userId: userId });

        if (!account) {
            account = new Account({ userId: userId, campaigns: [], totalAmount: 0 });
        }

        // Update the account with the new commission amount
        const campaignIndex = account.campaigns.findIndex(c => c.campaignId.toString() === campaignId.toString());
        if (campaignIndex > -1) {
            account.campaigns[campaignIndex].amount += commission;
        } else {
            account.campaigns.push({ campaignId: campaignId, amount: commission });
        }

        account.totalAmount += commission;
        account.updated_at = Date.now();
        await account.save();
        res.json({ message: 'Approved succesfully', success: true });
    } catch (err) {
        console.log("err(approveOrder)......", err);
        res.json({ message: "An error occured while approving order", success: false });
    }
};

module.exports.getWithdrawlRequests = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("userId........", userId);
        const withdrawls = await Withdrawal.find({ userId: userId });
        res.json({ message: "Withdrawl requests fetched successfully", success: true, data: withdrawls });
    } catch (err) {
        console.log("err(getWithdrawlRequests)......", err);
        res.json({ message: "An error occured while fetching withdrawl requests", success: false });
    }
};