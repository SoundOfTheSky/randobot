const Utils = require('../utils');
module.exports = {
  id: 'dl',
  title: 'Deaf lagging',
  voice: true,
  event: 'loop',
  handler: guild => {
    const connection = Utils.getGuildVC(guild.id);
    const members = Utils.getChannelMembers(connection.channel);
    const victim = members[Math.floor(members.length * Math.random())];
    if (!victim) return;
    const interval = setInterval(() => {
      if (victim.voice) victim.voice.setDeaf(!victim.voice.deaf).catch(e => {});
    }, 2000);
    setTimeout(async () => {
      clearInterval(interval);
      if (victim.voice) victim.voice.setDeaf(false).catch(e => {});
    }, 10000 + Math.floor(Math.random() * 50000));
  },
};
