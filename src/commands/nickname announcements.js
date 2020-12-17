const Utils = require('../utils');
module.exports = {
  name: 'cmd nickname announcements',
  handler: (msg, gSettings, words) => {
    gSettings.na = !gSettings.na;
    if (gSettings.na) Utils.sendMsg(msg.channel, words['nickname announcements enabled'], gSettings.dmt);
    else Utils.sendMsg(msg.channel, words['nickname announcements disabled'], gSettings.dmt);
  },
};
