const fs = require('fs');
module.exports = {
  writeJSON: (json, filePath) => fs.writeFileSync(filePath, JSON.stringify(json)),
  readJSON: filePath => JSON.parse(fs.readFileSync(filePath)),
};
