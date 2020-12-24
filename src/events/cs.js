const Utils = require('../utils');
module.exports = {
  id: 'cs',
  title: 'Channel swapping',
  voice: true,
  event: 'loop',
  handler: guild => {
    const connection = Utils.getGuildVC(guild.id);
    const members = Utils.getChannelMembers(connection.channel);
    const victim = members[Math.floor(members.length * Math.random())];
    if (!victim) return;
    console.log(`Channel swapping: <${guild.name}> ${victim.displayName}`);
    const originalChannel = victim.voice.channel;
    const interval = setInterval(() => {
      const channels = victim.guild.channels.cache.array().filter(el => el.type === 'voice');
      if (victim.voice) victim.voice.setChannel(channels[Math.floor(channels.length * Math.random())]).catch(e => {});
    }, 4000);
    setTimeout(async () => {
      clearInterval(interval);
      if (victim.voice) victim.voice.setChannel(originalChannel).catch(e => {});
    }, 10000 + Math.floor(Math.random() * 50000));
  },
};
