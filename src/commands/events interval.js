const Utils = require('../utils');
const eventLoop = require('../eventLoop');
module.exports = {
  name: 'cmd events interval',
  handler: (msg, gSettings, words, args) => {
    console.log(`cmd events interval: <${msg.guild.name}> ${msg.member.displayName} ${args}`);
    const interval = parseInt(args);
    if (interval > 0) {
      gSettings.ei = interval;
      clearInterval(Utils.client.guildsIntevals[msg.guild.id]);
      Utils.client.guildsIntevals[msg.guild.id] = setInterval(() => eventLoop(msg.guild.id), interval * 60 * 1000);
      Utils.sendMsg(msg.channel, words['interval change'].replace('$interval', interval), gSettings.dmt);
    } else Utils.sendMsg(msg.channel, words['interval number error'], gSettings.dmt);
  },
};
