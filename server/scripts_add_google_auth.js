const fs = require('fs');

const path = 'server/controllers/userController.js';
let content = fs.readFileSync(path, 'utf8');

const importStatement = `const { OAuth2Client } = require('google-auth-library');\nconst client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '724181008577-bq00unksatpgheohnbo1sm37rl9rqp41.apps.googleusercontent.com');\n\n`;

content = content.replace("const bcrypt = require('bcryptjs');\nconst User = require('../models/User');", "const bcrypt = require('bcryptjs');\nconst User = require('../models/User');\n" + importStatement);

const functionCode = `
// @desc Auth user with Google
// @route POST /api/users/google
// @access Public
const googleAuth = async (req, res) => {
  const { credential, role, studentId, contactNumber, vehicle } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || '724181008577-bq00unksatpgheohnbo1sm37rl9rqp41.apps.googleusercontent.com',
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        contactNumber: getResolvedContactNumber(user),
        role: user.role,
        isVerified: user.isVerified,
        token: generateToken(user._id)
      });
    }

    // New user, checking role requirements
    if (!studentId || !contactNumber || !role) {
      return res.status(400).json({ message: 'Missing required extra fields for Google Signup' });
    }

    if (role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be created via Google Sign Up' });
    }

    if (role === 'driver') {
      if (!vehicle || !vehicle.make || !vehicle.model || !vehicle.color || !vehicle.licensePlate || !vehicle.year) {
        return res.status(400).json({ message: 'Vehicle details are required for drivers' });
      }
    }

    user = await User.create({
      name,
      email,
      googleId,
      studentId,
      contactNumber,
      role: role || 'rider',
      password: '',
      vehicle: role === 'driver' ? vehicle : undefined
    });

    if (user) {
      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        contactNumber: getResolvedContactNumber(user),
        role: user.role,
        isVerified: user.isVerified,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Google Auth failed' });
  }
};
`;

content = content.replace("module.exports = {", functionCode + "\nmodule.exports = {\n  googleAuth,");

fs.writeFileSync(path, content);
