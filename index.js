const Discord = require('discord.js');
const client = new Discord.Client();
const events = ['deafLag', 'channelSwapper', 'dmBomber'];
client.once('ready', () => {
  console.log('ready');
  function eventLoop() {
    const timeToEvent = 50 * 60 * 1000 * Math.random() + 10 * 60 * 1000;
    console.log('Time to event ' + timeToEvent / 1000 / 60 + ' min');
    setTimeout(() => {
      switch (events[Math.floor(events.length * Math.random())]) {
        case 'deafLag':
          client.channels.cache
            .array()
            .filter(el => el.type === 'voice')
            .forEach(el => {
              const members = getChannelMembers(el);
              const victim = members[Math.floor(members.length * Math.random())];
              if (!victim) return;
              console.log('deaflagging ' + victim.user.username);
              const interval = setInterval(() => {
                victim.voice.setDeaf(!victim.voice.deaf);
              }, 2000);
              setTimeout(() => {
                console.log('End of deaflagging');
                clearInterval(interval);
                victim.voice.setDeaf(false);
              }, 30000);
            });
          break;
        case 'channelSwapper':
          client.channels.cache
            .array()
            .filter(el => el.type === 'voice')
            .forEach(el => {
              const members = getChannelMembers(el);
              const victim = members[Math.floor(members.length * Math.random())];
              if (!victim) return;
              console.log('channelSwapping ' + victim.user.username);
              const originalChannel = victim.voice.channel;
              const interval = setInterval(() => {
                const channels = victim.guild.channels.cache.array().filter(el => el.type === 'voice');
                victim.voice.setChannel(channels[Math.floor(channels.length * Math.random())]);
              }, 2000);
              setTimeout(() => {
                console.log('End of channelSwapping');
                clearInterval(interval);
                victim.voice.setChannel(originalChannel);
              }, 30000);
            });
          break;
        case 'dmBomber':
          client.channels.cache
            .array()
            .filter(el => el.type === 'voice')
            .forEach(el => {
              const members = getChannelMembers(el);
              const victim = members[Math.floor(members.length * Math.random())];
              if (!victim) return;
              console.log('dmBombing ' + victim.user.username);
              const originalChannel = victim.voice.channel;
              const interval = setInterval(() => victim.createDM().then(dm => dm.send('АХАХАХАХХА')), 4000);
              setTimeout(() => {
                console.log('End of dmBombing');
                clearInterval(interval);
                victim.voice.setChannel(originalChannel);
              }, 30000);
            });
          break;
      }
      eventLoop();
    }, timeToEvent);
  }
  eventLoop();
});
client.on('voiceStateUpdate', async (oldMember, newMember) => {
  try {
    if (newMember.member.user.bot) return;
    //console.log(newMember.guild.members.cache.array().map(el => el.user));
    const biggestVoiceChannel = newMember.guild.channels.cache
      .array()
      .filter(el => el.type === 'voice')
      .sort((a, b) => getChannelMembers(b).length - getChannelMembers(a).length)[0];
    if (getChannelMembers(biggestVoiceChannel).length) await biggestVoiceChannel.join();
    else oldMember.channel.leave();
    if (!oldMember.channel && newMember.channel) {
      const connection = getChannelVoiceConnection(newMember.channel);
      if (connection) connection.play(`./audio/nicknameAnnouncements/${newMember.member.user.id}.mp3`);
    }
  } catch (e) {
    console.error(e);
  }
});
const getChannelVoiceConnection = channel => client.voice.connections.get(channel.guild.id);
const getChannelMembers = channel => channel.members.array().filter(el => !el.user.bot);
client.login('NzM5MjQ1NDc3Mjc0NDUxOTcw.XyXqAA.3fe1RF1LcPcgeHnVw435jI3m5cI');
