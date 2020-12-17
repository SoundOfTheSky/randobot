const Utils = require('../utils');
module.exports = {
  name: 'cmd events enable',
  handler: (msg, gSettings, words) => {
    gSettings.de = [];
    Utils.sendMsg(msg.channel, words['all events enabled'], gSettings.dmt);
  },
};
