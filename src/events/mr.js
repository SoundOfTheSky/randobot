const Utils = require('../utils');
module.exports = {
  id: 'mr',
  title: 'Message reaction',
  event: 'message',
  handler: msg => {
    try {
      if (msg.author.bot || msg.channel.type === 'dm' || Math.random() > 0.1) return;
      const reactions = Utils.client.translations[Utils.client.guildsSettings[msg.guild.id].l]['message reactions'];
      for (const l of reactions[Math.floor(Math.random() * reactions.length)].split(''))
        msg.react(Utils.emojis[`:regional_indicator_${l}:`]);
    } catch {}
  },
};
