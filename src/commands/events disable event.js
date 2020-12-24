const Utils = require('../utils');
module.exports = {
  name: 'cmd events disable event',
  handler: (msg, gSettings, words, eventName) => {
    console.log(`cmd events disable event: <${msg.guild.name}> ${msg.member.displayName} ${args}`);
    const eventCode = Utils.client.events.find(e => e.title === eventName);
    if (!eventCode) return Utils.sendMsg(msg.channel, words['no event with name'], gSettings.dmt);
    if (!gSettings.de.includes(eventCode.id)) gSettings.de.push(eventCode.id);
    Utils.sendMsg(msg.channel, words['event disabled'].replace('$eventName', eventName), gSettings.dmt);
  },
};
