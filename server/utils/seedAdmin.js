const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ensureDefaultAdmin = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@glide.local').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
  const adminName = process.env.ADMIN_NAME || 'Platform Admin';
  const adminStudentId = process.env.ADMIN_STUDENT_ID || 'ADMIN-0001';

  if (!adminEmail || !adminPassword) {
    console.warn('Skipping default admin seed: ADMIN_EMAIL or ADMIN_PASSWORD is missing.');
    return;
  }

  const adminExists = await User.findOne({ role: 'admin' });
  if (adminExists) {
    return;
  }

  const emailInUse = await User.findOne({ email: adminEmail });
  if (emailInUse) {
    console.warn(`Cannot seed default admin. Email already used by a non-admin user: ${adminEmail}`);
    return;
  }

  const studentIdInUse = await User.findOne({ studentId: adminStudentId });
  if (studentIdInUse) {
    console.warn(`Cannot seed default admin. Student ID already in use: ${adminStudentId}`);
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(adminPassword, salt);

  await User.create({
    name: adminName,
    email: adminEmail,
    studentId: adminStudentId,
    password: hashedPassword,
    role: 'admin',
    isVerified: true
  });

  console.log(`Default admin created: ${adminEmail}`);
};

module.exports = { ensureDefaultAdmin };
