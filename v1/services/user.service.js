const {
  ObjectId
} = require('mongoose').Types;
const moment = require('moment')






const User = require("../../models/user.model")

exports.getUser = async (idOrEmail, fieldName = '_id') => {
  const data = await User.findOne({
    [fieldName]: `${idOrEmail}`
  }).lean();
  return data;
};


exports.Usersave = data => new User(data).save();

exports.deleteUser = async userId => {
  try {
    const deleteData = await User.findByIdAndDelete(userId)
    return deleteData
  } catch (err) {
    throw err
  }
}


exports.convertDaysToDate = (days) => {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const referenceDate = new Date(Date.UTC(1900, 0, 1));

  const offsetMilliseconds = days * millisecondsPerDay;
  const date = new Date(referenceDate.getTime() + offsetMilliseconds);
  let data = moment(date).format('DD-MM-YYYY')
  return data;
}