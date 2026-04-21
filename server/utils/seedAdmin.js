const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ensureDefaultAdmin = async () => {
  const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@glide.local').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  const adminName = process.env.ADMIN_NAME || 'Platform Admin';

  if (!adminUsername || !adminPassword) {
    console.warn('Skipping default admin seed: ADMIN_USERNAME or ADMIN_PASSWORD is missing.');
    return;
  }

  const adminWithUsername = await User.findOne({ role: 'admin', username: adminUsername });
  if (adminWithUsername) {
    return;
  }

  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    if (!existingAdmin.username) {
      await User.updateOne(
        { _id: existingAdmin._id },
        { $set: { username: adminUsername } }
      );
      console.log(`Existing admin updated with username: ${adminUsername}`);
    }
    return;
  }

  const usernameInUse = await User.findOne({ username: adminUsername });
  if (usernameInUse) {
    console.warn(`Cannot seed default admin. Username already in use: ${adminUsername}`);
    return;
  }

  const emailInUse = await User.findOne({ email: adminEmail });
  if (emailInUse) {
    console.warn(`Cannot seed default admin. Email already in use: ${adminEmail}`);
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(adminPassword, salt);

  await User.create({
    name: adminName,
    username: adminUsername,
    email: adminEmail,
    password: hashedPassword,
    role: 'admin',
    isVerified: true
  });

  console.log(`Default admin created: ${adminUsername}`);
};

module.exports = { ensureDefaultAdmin };
