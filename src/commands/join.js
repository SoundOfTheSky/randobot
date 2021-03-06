const Utils = require('../utils');
module.exports = {
  name: 'cmd join',
  handler: (msg, gSettings, words) => {
    console.log(`cmd join: <${msg.guild.name}> ${msg.member.displayName}`);
    if (!msg.member.voice?.channelID)
      return Utils.sendMsg(msg.channel, words['you are not in voice channel'], gSettings.dmt);
    const connection = Utils.getGuildVC(msg.guild.id);
    if (connection) connection.channel.leave();
    msg.member.voice.channel.join();
  },
};
