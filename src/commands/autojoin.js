const Utils = require('../utils');
module.exports = {
  name: 'cmd autojoin',
  handler: (msg, gSettings, words) => {
    if (gSettings.aj) delete gSettings.aj;
    else gSettings.aj = 1;
    if (gSettings.aj) Utils.sendMsg(msg.channel, words['autojoin enabled'], gSettings.dmt);
    else Utils.sendMsg(msg.channel, words['autojoin disabled'], gSettings.dmt);
  },
};
