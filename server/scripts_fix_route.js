const fs = require('fs');
const path = 'server/routes/userRoutes.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("adminDeleteUser\n}", "adminDeleteUser,\n        googleAuth\n}");
fs.writeFileSync(path, content);
