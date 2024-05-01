
const Campaign = require('../../models/campaign.model');


exports.saveCampaign =  (data) => new Campaign(data).save();


