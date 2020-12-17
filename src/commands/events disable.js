const Utils = require('../utils');
module.exports = {
  name: 'cmd events disable',
  handler: (msg, gSettings, words) => {
    gSettings.de = Utils.client.events.map(e => e.id);
    Utils.sendMsg(msg.channel, words['all events disabled'], gSettings.dmt);
  },
};
