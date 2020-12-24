const Utils = require('../utils');
module.exports = {
  name: 'cmd clear chat after',
  handler: (msg, gSettings, words, args) => {
    console.log(`cmd clear chat after: <${msg.guild.name}> ${msg.member.displayName} ${args}`);
    const interval = parseInt(args);
    if (interval >= 0) {
      gSettings.dmt = interval;
      if (interval === 0) Utils.sendMsg(msg.channel, words['chat clear interval 0'], gSettings.dmt);
      else
        Utils.sendMsg(msg.channel, words['chat clear interval change'].replace('$interval', interval), gSettings.dmt);
    } else Utils.sendMsg(msg.channel, words['interval number error'], gSettings.dmt);
  },
};
