const mongoose = require('mongoose');

exports.connect = async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST);
  // Safety: tests delete data, so refuse to run on a non-test database
  if (!/test/i.test(mongoose.connection.name)) {
    await mongoose.disconnect();
    throw new Error('MONGO_URI_TEST must point to a database whose name contains "test"');
  }
  // Make sure unique indexes exist before tests run
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
};

exports.clear = async () => {
  for (const c of Object.values(mongoose.connection.collections)) await c.deleteMany({});
};

exports.close = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};