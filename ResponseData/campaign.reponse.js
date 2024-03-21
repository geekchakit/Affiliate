

exports.addCampaignResponse = (data) => {

    return {
        campaignName: data.campaignName,
        status: data.status,
        countryName: data.countryName,
        commissionName: data.commissionName,
        paymentTerm: data.paymentTerm,
        conversionRate: data.conversionRate,
        confirmationRate: Date.confirmationRate
    }
}