const fs = require('fs');
const guildsSettings = require('./guildsSettings.json');
setImmediate(async () => {
  for (const gid of Object.keys(guildsSettings)) {
    delete guildsSettings[gid].na;
    if (guildsSettings[gid].aj === 0) delete guildsSettings[gid].aj;
  }
  fs.writeFileSync(__dirname + '/guildsSettings.json', JSON.stringify(guildsSettings));
});
