const Utils = require('../utils');

module.exports = {
  name: 'cmd language',
  handler: async (msg, gSettings, words, args) => {
    if (args) {
      args = args.toLowerCase();
      const langCodes = Object.keys(Utils.client.translations);
      const langValues = Object.values(Utils.client.translations);
      let i = langCodes.indexOf(args);
      if (i === -1) i = langValues.findIndex(el => el.name.toLowerCase() === args);
      if (i === -1) i = langValues.findIndex(el => el.localName.toLowerCase() === args);
      if (i === -1) {
        let ei = Object.values(Utils.emojis).indexOf(args);
        if (ei !== -1) {
          const flag = Object.keys(Utils.emojis)[ei];
          i = langValues.findIndex(el => el.flag.toLowerCase() === flag);
        }
      }
      if (i === -1) return Utils.sendMsg(msg.channel, words['language not found'], gSettings.dmt);
      gSettings.l = langCodes[i];
    } else {
      const message = await msg.channel.send('Choose language:');
      const flags = Object.values(Utils.client.translations).map(t => Utils.emojis[t.flag]);
      await Promise.all(flags.map(f => message.react(f)));
      const deleteTimeout = setTimeout(() => {
        message.delete().catch(e => {});
      }, gSettings.dmt * 1000);
      const reaction = (
        await message.awaitReactions((r, u) => !u.bot && flags.includes(r.emoji.name), {
          max: 1,
          timeout: gSettings.dmt * 1000,
        })
      ).keyArray()[0];
      clearTimeout(deleteTimeout);
      message.delete().catch(() => {});
      if (!reaction) return;
      gSettings.l = Object.keys(Utils.client.translations)[flags.indexOf(reaction)];
    }
    Utils.sendMsg(
      msg.channel,
      words['language changed'].replace('$language', Utils.client.translations[gSettings.l].localName),
      gSettings.dmt,
    );
  },
};
