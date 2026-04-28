const fs = require('fs');

const path = 'server/routes/userRoutes.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("const { registerUser, loginUser, getUserProfile, updateUserProfile, uploadDocuments } = require('../controllers/userController');", "const { registerUser, loginUser, getUserProfile, updateUserProfile, uploadDocuments, googleAuth } = require('../controllers/userController');");

content = content.replace("router.post('/login', loginUser);", "router.post('/login', loginUser);\nrouter.post('/google', googleAuth);");

fs.writeFileSync(path, content);
