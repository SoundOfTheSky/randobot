const Utils = require('../utils');
const Discord = require('discord.js');
module.exports = {
  name: 'cmd events',
  handler: (msg, gSettings, words) => {
    console.log(`cmd events: <${msg.guild.name}> ${msg.member.displayName}`);
    Utils.sendMsg(
      msg.channel,
      new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(words['event list title'])
        .addFields(
          ...Utils.client.events.map(e => ({
            name: `${e.title} - ${gSettings.de.includes(e.id) ? words.disabled : words.enabled}`,
            value: words[e.id + ' description'],
          })),
        ),
      gSettings.dmt,
    );
  },
};
