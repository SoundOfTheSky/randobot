const Utils = require('../utils');
const reactions = ['gay', 'fag', 'nice', 'minecraft', 'nige', 'ugly', 'simp', 'cringe'];
module.exports = {
  id: 'mr',
  title: 'Message reaction',
  event: 'message',
  handler: async (guild, msg) => {
    if (msg.guild.id !== guild.id || msg.author.bot || msg.channel.type === 'dm' || Math.random() > 0.1) return;
    for (const l of reactions[Math.floor(Math.random() * reactions.length)].split('')) {
      await msg.react(Utils.emojis[`:regional_indicator_${l}:`]);
    }
  },
};
