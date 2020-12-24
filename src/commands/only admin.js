const Utils = require('../utils');
module.exports = {
  name: 'cmd only admin',
  handler: (msg, gSettings, words) => {
    console.log(`cmd only admin: <${msg.guild.name}> ${msg.member.displayName}`);
    if (gSettings.oa) delete gSettings.oa;
    else gSettings.oa = 1;
    if (gSettings.oa) Utils.sendMsg(msg.channel, words['only admin enabled'], gSettings.dmt);
    else Utils.sendMsg(msg.channel, words['only admin disabled'], gSettings.dmt);
  },
};
