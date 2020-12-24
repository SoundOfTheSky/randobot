const Utils = require('../utils');
module.exports = {
  name: 'cmd events disable',
  handler: (msg, gSettings, words) => {
    console.log(`cmd events disable: <${msg.guild.name}> ${msg.member.displayName}`);
    gSettings.de = Utils.client.events.map(e => e.id);
    Utils.sendMsg(msg.channel, words['all events disabled'], gSettings.dmt);
  },
};
