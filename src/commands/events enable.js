const Utils = require('../utils');
module.exports = {
  name: 'cmd events enable',
  handler: (msg, gSettings, words) => {
    console.log(`cmd events disable: <${msg.guild.name}> ${msg.member.displayName}`);
    gSettings.de = [];
    Utils.sendMsg(msg.channel, words['all events enabled'], gSettings.dmt);
  },
};
