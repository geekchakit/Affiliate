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
        let { userId, amount, invoiceNumber, billingId } = req.body;
        const file = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        const availableBalance = await Account.findOne({ userId: userId });
        amount =  parseInt(amount);
        console.log(amount);
        if (availableBalance.requestedAmount +  parseInt(amount) > availableBalance.totalAmount) {
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
                amount,
                invoiceNumber,
                file,
                billingId
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
    const { userId, withdrawlId, statusMessage, status, utrNumber } = req.body;
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
        if (status === "completed") {
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
        console.log("categoryName........", categoryName);

        let commissionRate;
        const category = await Category.findOne({ categoryName: categoryName, campaignId: campaignId });
        console.log("category........", category);
        if (!category) {
            return res.json({ message: 'Category not found', success: false });
        }

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
                console.log("commissionRate........", commissionRate);
            } else {
                commissionRate = category.defaultRate;
                console.log("commissionRate........", commissionRate);
            }
        }

        const commission = (commissionRate && revenue) ? (revenue * (commissionRate / 100)) : 0;
        console.log("commission........", commission);

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

        // Referal commission
        // Example created_at string
        const user = await User.findById(userId);
        console.log("users",user);
        const created_at = user.created_at;

        // Parse the created_at string to a Date object
        const createdDate = new Date(created_at);

        // Calculate one month after createdDate
        const oneMonthAfterCreatedDate = new Date(createdDate);
        oneMonthAfterCreatedDate.setMonth(createdDate.getMonth() + 1);

        // Get the current date
        const currentDate = new Date();

        // Check if currentDate is within one month after createdDate
        if (currentDate <= oneMonthAfterCreatedDate) {
            console.log("Referred by user gets referral money");
            const referalCode = user.referred_by;
            console.log(referalCode);
            const refredBy = await User.findOne({ referral_code: referalCode });
            console.log("referedby",refredBy);
            if (refredBy) {
                const refredByAccount = await Account.findOne({ userId: refredBy._id });
                if (refredByAccount) {
                    const referalCommission = commission/10;
                    refredByAccount.totalAmount += referalCommission;
                    refredByAccount.updated_at = Date.now();
                    await refredByAccount.save();
                }
                else{
                    const refredByAccount = new Account({ userId: refredBy._id, campaigns: [], totalAmount: 0 });
                    const referalCommission = commission/10;
                    refredByAccount.totalAmount += referalCommission;
                    refredByAccount.updated_at = Date.now();
                    await refredByAccount.save();
                }
            }
        } else {
            console.log("The period for earning referral money has passed");
        }
        //end referal commission
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
        const withdrawls = await Withdrawal.find({ userId: userId }).populate('userId').populate('billingId');
        
        res.json({ message: "Withdrawl requests fetched successfully", success: true, data: withdrawls.reverse() });
    } catch (err) {
        console.log("err(getWithdrawlRequests)......", err);
        res.json({ message: "An error occured while fetching withdrawl requests", success: false });
    }
};

module.exports.getWithdrawalRequestsForAdmin = async (req, res) => {
    try {
        const status = req.params.status;
        const withdrawls = await Withdrawal.find({ status: status }).populate('userId',).populate('billingId');
        res.json({ message: "Withdrawl requests fetched successfully", success: true, data: withdrawls.reverse() });
    } catch (err) {
        console.log("err(getWithdrawlRequests)......", err);
        res.json({ message: "An error occured while fetching withdrawl requests", success: false });
    }
};

module.exports.getTotalBalance = async (req, res) => {
    try {
        const { userId } = req.params;
        const account = await Account.findOne({ userId: userId });
        res.json({ message: "Total balance fetched successfully", success: true, data: account });
    } catch (err) {
        console.log("err(getTotalBalance)......", err);
        res.json({ message: "An error occured while fetching total balance", success: false });
    }
}