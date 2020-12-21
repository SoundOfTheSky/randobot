const Utils = require('./utils');
module.exports = function eventLoop(guildId) {
  try {
    const guild = Utils.client.guilds.cache.get(guildId);
    const gSettings = Utils.client.guildsSettings[guildId];
    const connection = Utils.getGuildVC(guildId);
    const es = Utils.client.events.filter(
      e => e.event === 'loop' && !gSettings.de.includes(e.id) && (!e.voice || connection),
    );
    if (!es.length) return;
    return es[Math.floor(es.length * Math.random())].handler(guild);
  } catch (e) {
    console.error(e);
  }
};
