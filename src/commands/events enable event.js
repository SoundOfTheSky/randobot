const Utils = require('../utils');
module.exports = {
  name: 'cmd events enable event',
  handler: (msg, gSettings, words, eventName) => {
    const eventCode = Utils.client.events.find(e => e.title === eventName);
    if (!eventCode) return Utils.sendMsg(msg.channel, words['no event with name'], gSettings.dmt);
    gSettings.de = gSettings.de.filter(e => e !== eventCode.id);
    Utils.sendMsg(msg.channel, words['event enabled'].replace('$eventName', eventName), gSettings.dmt);
  },
};
