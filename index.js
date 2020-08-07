const Discord = require('discord.js');
const fs = require('fs');

const Utils = require('./utils');
const help = `Hi! I'm probably most annoying bot in the universe.
However you can change my behavior by this commands:

events - List of events
events enable/disable - enable/disable all events
events enable/disable [name of event] - enable/disable specific event
events interval [number] - set interval between events in minutes. Default: 90
autojoin - toggle autojoin to voice channels
nickname announcements - toggle nickname announcements
clear chat after [number] - After how many seconds bot will delete messages related to him. Default: 600. If set 0 will never delete messages.
`;
if (!fs.existsSync(__dirname + '/settings.json')) {
  console.log('Created settings.json', 'DONT FORGET TO ADD YOUR TOKEN');
  Utils.writeJSON(
    {
      token: '',
      prefix: 'OwO',
      saveGuildsSettingsInterval: 10000,
    },
    __dirname + '/settings.json',
  );
}
if (!fs.existsSync(__dirname + '/guildsSettings.json')) Utils.writeJSON({}, __dirname + '/guildsSettings.json');

const settings = Utils.readJSON(__dirname + '/settings.json');
const guildsSettings = Utils.readJSON(__dirname + '/guildsSettings.json');
const client = new Discord.Client();
const guildsIntevals = {};
function eventLoop(guild) {
  try {
    const gSettings = guildsSettings[guild.id];
    const events = [];
    Object.keys(gSettings.events).forEach(el => {
      if (gSettings.events[el]) events.push(el);
    });
    switch (events[Math.floor(events.length * Math.random())]) {
      case 'Deaf lagging': {
        if (guild.voice) {
          const members = getChannelMembers(guild.voice.channel);
          const victim = members[Math.floor(members.length * Math.random())];
          if (!victim) return;
          console.log('deafing ' + victim.user.username);
          const interval = setInterval(() => {
            victim.voice.setDeaf(!victim.voice.deaf);
          }, 2000);
          setTimeout(() => {
            console.log('End of deafing');
            clearInterval(interval);
            victim.voice.setDeaf(false);
          }, 30000);
        }
        break;
      }
      case 'Channel swapping': {
        if (guild.voice) {
          const members = getChannelMembers(guild.voice.channel);
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
        }
        break;
      }
      case 'Random audio memes': {
        if (guild.voice) {
          const members = getChannelMembers(guild.voice.channel);
          if (members.length === 0) return;
          const sounds = fs.readdirSync(__dirname + '/audio/random');
          let play = true;
          console.log('Playing random audio memes');
          function playRandom() {
            if (guild.voice.connection && play)
              guild.voice.connection
                .play(__dirname + '/audio/random/' + sounds[Math.floor(sounds.length * Math.random())])
                .once('finish', () => playRandom());
          }
          playRandom();
          setTimeout(() => {
            console.log('Random audio memes end');
            play = false;
          }, 40000);
        }
        break;
      }
    }
  } catch (e) {
    console.error(e);
  }
}
client.once('ready', () => {
  console.log('Logged in!');
  // Sync guilds
  const guildsAreIn = client.guilds.cache.array();
  const leftGuilds = Object.keys(guildsSettings);
  guildsAreIn.forEach(guild => {
    const found = leftGuilds.indexOf(guild.id);
    if (found > -1) leftGuilds.splice(found, 1);
    else guildCreate(guild);
  });
  leftGuilds.forEach(guild => guildDelete(client.guilds.cache.get(guild)));
  console.log(`Guilds: ${Object.keys(guildsSettings).length}`);
  Object.keys(guildsSettings).forEach(guild => {
    console.log(client.guilds.cache.get(guild).name);
    if (!guildsIntevals[guild])
      guildsIntevals[guild.id] = setInterval(
        () => eventLoop(client.guilds.cache.get(guild)),
        guildsSettings[guild].eventsInterval * 60 * 1000,
      );
  });
  Utils.writeJSON(guildsSettings, __dirname + '/guildsSettings.json');
  setInterval(
    () => Utils.writeJSON(guildsSettings, __dirname + '/guildsSettings.json'),
    settings.saveGuildsSettingsInterval,
  );
});

client.on('message', msg => {
  if (!msg.content.startsWith(settings.prefix) || msg.author.bot || msg.channel.type === 'dm') return;
  const message = msg.content.replace(settings.prefix + ' ', '');
  const gSettings = guildsSettings[msg.guild.id];
  const sendMsg = data => {
    msg.channel.send(data).then(message => {
      if (gSettings.deleteMessagesTimeout > 0)
        setTimeout(() => message.delete(), gSettings.deleteMessagesTimeout * 1000);
    });
  };
  if (gSettings.deleteMessagesTimeout > 0)
    setTimeout(() => {
      msg.delete();
    }, gSettings.deleteMessagesTimeout * 1000);
  if (message === 'events') {
    const events = [];
    Object.keys(guildsSettings[msg.guild.id].events).forEach(event =>
      events.push({
        name: event,
        value: guildsSettings[msg.guild.id].events[event] ? 'Enabled' : 'Disabled',
      }),
    );
    sendMsg(
      new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Events')
        .addFields(...events),
    );
  } else if (message === 'events enable') {
    Object.keys(gSettings.events).forEach(event => (gSettings.events[event] = true));
    sendMsg(`All events are now enabled!`);
  } else if (message === 'events disable') {
    Object.keys(gSettings.events).forEach(event => (gSettings.events[event] = false));
    sendMsg(`All events are now disabled!`);
  } else if (message.startsWith('events enable ')) {
    const eventName = message.replace('events enable ', '');
    if (!Object.keys(gSettings.events).includes(eventName)) return sendMsg('There are no events with that name');
    gSettings.events[eventName] = true;
    sendMsg(`Event "${eventName}" is now enabled and can happen at any moment`);
  } else if (message.startsWith('events disable ')) {
    const eventName = message.replace('events disable ', '');
    if (!Object.keys(gSettings.events).includes(eventName)) return sendMsg('There are no events with that name');
    gSettings.events[eventName] = false;
    sendMsg(`Event "${eventName}" is now disabled and will never happen until somebody enables it`);
  } else if (message.startsWith('events interval ')) {
    const interval = parseInt(message.replace('events interval ', ''));
    if (interval > 0) {
      gSettings.eventsInterval = interval;
      clearInterval(guildsIntevals[msg.guild.id]);
      guildsIntevals[msg.guild.id] = setInterval(() => eventLoop(msg.guild), gSettings.eventsInterval * 60 * 1000);
      sendMsg(`Events wiil now happen every ${interval} min!`);
    } else sendMsg('Interval must be a positive number');
  } else if (message.startsWith('clear chat after ')) {
    const interval = parseInt(message.replace('clear chat after ', ''));
    if (interval >= 0) {
      gSettings.deleteMessagesTimeout = interval;
      if (interval === 0) sendMsg('Bot will now not delete messages.');
      else sendMsg(`Bot will now delete messages after ${interval} seconds!`);
    } else sendMsg('Interval must be a positive number');
  } else if (message === 'autojoin') {
    gSettings.autojoin = !gSettings.autojoin;
    if (gSettings.autojoin) sendMsg('Now bot will automatically join to voice channels!');
    else sendMsg('Now bot will not join voice channels!');
  } else if (message === 'nickname announcements') {
    gSettings.nicknameAnnouncements = !gSettings.nicknameAnnouncements;
    if (gSettings.nicknameAnnouncements)
      sendMsg('Now bot will say nicknames of people that just joined voice channel!');
    else sendMsg('Now bot will remain silent!');
  } else sendMsg(msg.channel, help);
});
client.on('voiceStateUpdate', async (oldMember, newMember) => {
  try {
    if (newMember.member.user.bot) return;
    const gSettings = guildsSettings[newMember.guild.id];
    //console.log(newMember.guild.members.cache.array().map(el => el.user));
    const biggestVoiceChannel = newMember.guild.channels.cache
      .array()
      .filter(el => el.type === 'voice')
      .sort((a, b) => getChannelMembers(b).length - getChannelMembers(a).length)[0];
    if (getChannelMembers(biggestVoiceChannel).length) {
      if (gSettings.autojoin && !biggestVoiceChannel.members.array().find(el => el.user.id === client.user.id))
        await biggestVoiceChannel.join();
    } else oldMember.channel.leave();
    setTimeout(() => {
      if (
        gSettings.nicknameAnnouncements &&
        newMember.channel &&
        newMember.guild.voice &&
        newMember.channel.id === newMember.guild.voice.channel.id &&
        (!oldMember.channel || oldMember.channel.id !== newMember.channel.id)
      ) {
        const connection = getChannelVoiceConnection(newMember.channel);

        if (connection) connection.play(__dirname + `/audio/nicknameAnnouncements/${newMember.member.user.id}.mp3`);
        //eventLoop(newMember.guild);
      }
    }, 500);
  } catch (e) {
    console.error(e);
  }
});
function guildCreate(guild) {
  guildsSettings[guild.id] = {
    events: {
      'Channel swapping': true,
      'Deaf lagging': true,
      'Random audio memes': true,
    },
    deleteMessagesTimeout: 600,
    autojoin: true,
    nicknameAnnouncements: true,
    eventsInterval: 90,
  };
  guild.channels.cache.array()[0].send(help);
  guildsIntevals[guild.id] = setInterval(() => eventLoop(guild), 90 * 60 * 1000);
}
client.on('guildCreate', guildCreate);
function guildDelete(guild) {
  delete guildsSettings[guild.id];
  clearInterval(guildsIntevals[guild.id]);
  delete guildsIntevals[guild.id];
}
client.on('guildDelete', guildDelete);
const getChannelVoiceConnection = channel => client.voice.connections.get(channel.guild.id);
const getChannelMembers = channel => channel.members.array().filter(el => !el.user.bot);
client.login(settings.token);
