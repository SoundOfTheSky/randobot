const Discord = require('discord.js');
const fs = require('fs');

const Utils = require('./utils');
const tranlations = {};
fs.readdirSync(__dirname + '/translations').forEach(lang => {
  const file = Utils.readJSON(__dirname + '/translations/' + lang);
  tranlations[file.name] = file;
});
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
  console.log('Created settings.json\nDONT FORGET TO ADD YOUR TOKEN');
  Utils.writeJSON(
    {
      token: '',
      prefix: 'Randobot',
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
const eventsDescription = {
  'Deaf lagging': 'Will toggle deafen for one random victim in voice for 30 seconds.',
  'Channel swapping': `Selects a random victim in the voice channel and starts sending it to random channels for 30 seconds. The victim will then return to the original channel.`,
  'Random audio memes': 'Welcome to the cum zone',
};
function eventLoop(guild) {
  try {
    const gSettings = guildsSettings[guild.id];
    const events = [];
    Object.keys(gSettings.events).forEach(el => {
      if (gSettings.events[el]) events.push(el);
    });
    switch (events[Math.floor(events.length * Math.random())]) {
      case 'Deaf lagging': {
        if (guild.voice?.channel) {
          const members = getChannelMembers(guild.voice.channel);
          const victim = members[Math.floor(members.length * Math.random())];
          if (!victim) return;
          const interval = setInterval(() => {
            if (victim.voice) victim.voice.setDeaf(!victim.voice.deaf).catch(e => {});
          }, 2000);
          setTimeout(() => {
            clearInterval(interval);
            if (victim.voice) victim.voice.setDeaf(false).catch(e => {});
          }, 30000);
          gi;
        }
        break;
      }
      case 'Channel swapping': {
        if (guild.voice?.channel) {
          const members = getChannelMembers(guild.voice.channel);
          const victim = members[Math.floor(members.length * Math.random())];
          if (!victim) return;
          const originalChannel = victim.voice.channel;
          const interval = setInterval(() => {
            const channels = victim.guild.channels.cache.array().filter(el => el.type === 'voice');
            if (victim.voice)
              victim.voice.setChannel(channels[Math.floor(channels.length * Math.random())]).catch(e => {});
          }, 2000);
          setTimeout(() => {
            clearInterval(interval);
            if (victim.voice) victim.voice.setChannel(originalChannel).catch(e => {});
          }, 30000);
        }
        break;
      }
      case 'Random audio memes': {
        if (guild.voice?.channel) {
          const members = getChannelMembers(guild.voice.channel);
          if (members.length === 0) return;
          const sounds = fs.readdirSync(__dirname + '/audio/random');
          let play = true;
          function playRandom() {
            if (guild.voice && play)
              guild.voice.connection
                .play(__dirname + '/audio/random/' + sounds[Math.floor(sounds.length * Math.random())])
                .once('finish', () => playRandom());
          }
          playRandom();
          setTimeout(() => (play = false), 40000);
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
      guildsIntevals[guild] = setInterval(
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
  try {
    if (!msg.content.startsWith(settings.prefix) || msg.author.bot || msg.channel.type === 'dm') return;
    const message = msg.content.replace(settings.prefix + ' ', '');
    const gSettings = guildsSettings[msg.guild.id];
    const sendMsg = data => {
      msg.channel
        .send(data)
        .then(
          message =>
            gSettings.deleteMessagesTimeout > 0 &&
            message.delete({ timeout: gSettings.deleteMessagesTimeout * 1000 }).catch(e => {}),
        );
    };
    if (gSettings.deleteMessagesTimeout > 0)
      msg.delete({ timeout: gSettings.deleteMessagesTimeout * 1000 }).catch(e => {});
    if (message === tranlations[gSettings.language]['cmd events']) {
      const events = [];
      Object.keys(guildsSettings[msg.guild.id].events).forEach(event =>
        events.push({
          name:
            event +
            ' - ' +
            (guildsSettings[msg.guild.id].events[event]
              ? tranlations[gSettings.language]['enabled']
              : tranlations[gSettings.language]['disabled']),
          value: tranlations[gSettings.language][event + ' description'],
        }),
      );
      sendMsg(
        new Discord.MessageEmbed()
          .setColor('#0099ff')
          .setTitle('Events')
          .addFields(...events),
      );
    } else if (message === tranlations[gSettings.language]['cmd events enable']) {
      Object.keys(gSettings.events).forEach(event => (gSettings.events[event] = true));
      sendMsg(tranlations[gSettings.language]['all events enabled']);
    } else if (message === tranlations[gSettings.language]['cmd events disable']) {
      Object.keys(gSettings.events).forEach(event => (gSettings.events[event] = false));
      sendMsg(tranlations[gSettings.language]['all events disabled']);
    } else if (message.startsWith(tranlations[gSettings.language]['cmd events enable event'])) {
      const eventName = message.replace(tranlations[gSettings.language]['cmd events enable event'], '');
      if (!Object.keys(gSettings.events).includes(eventName))
        return sendMsg(tranlations[gSettings.language]['no event with name']);
      gSettings.events[eventName] = true;
      sendMsg(tranlations[gSettings.language]['event enabled'].replace('$eventName', eventName));
    } else if (message.startsWith(tranlations[gSettings.language]['cmd events disable event'])) {
      const eventName = message.replace(tranlations[gSettings.language]['cmd events disable event'], '');
      if (!Object.keys(gSettings.events).includes(eventName))
        return sendMsg(tranlations[gSettings.language]['no event with name']);
      gSettings.events[eventName] = false;
      sendMsg(tranlations[gSettings.language]['event disabled'].replace('$eventName', eventName));
    } else if (message.startsWith(tranlations[gSettings.language]['cmd events interval'])) {
      const interval = parseInt(message.replace(tranlations[gSettings.language]['cmd events interval'], ''));
      if (interval > 0) {
        gSettings.eventsInterval = interval;
        clearInterval(guildsIntevals[msg.guild.id]);
        guildsIntevals[msg.guild.id] = setInterval(() => eventLoop(msg.guild), gSettings.eventsInterval * 60 * 1000);
        sendMsg(tranlations[gSettings.language]['inerval change'].replace('$interval', interval));
      } else sendMsg(tranlations[gSettings.language]['interval number error']);
    } else if (message.startsWith(tranlations[gSettings.language]['cmd clear chat after'])) {
      const interval = parseInt(message.replace(tranlations[gSettings.language]['cmd clear chat after'], ''));
      if (interval >= 0) {
        gSettings.deleteMessagesTimeout = interval;
        if (interval === 0) sendMsg(tranlations[gSettings.language]['chat clear interval 0']);
        else sendMsg(tranlations[gSettings.language]['chat clear interval change']);
      } else sendMsg(tranlations[gSettings.language]['interval number error']);
    } else if (message === tranlations[gSettings.language]['autojoin']) {
      gSettings.autojoin = !gSettings.autojoin;
      if (gSettings.autojoin) sendMsg(tranlations[gSettings.language]['autojoin enabled']);
      else sendMsg(tranlations[gSettings.language]['autojoin disabled']);
    } else if (message === tranlations[gSettings.language]['nickname announcements']) {
      gSettings.nicknameAnnouncements = !gSettings.nicknameAnnouncements;
      if (gSettings.nicknameAnnouncements) sendMsg(tranlations[gSettings.language]['nickname announcements enabled']);
      else sendMsg(tranlations[gSettings.language]['nickname announcements disabled']);
    } else sendMsg(help);
  } catch (e) {
    console.error(e);
  }
});
client.on('voiceStateUpdate', async (oldMember, newMember) => {
  try {
    if (newMember.member.user.bot) return;
    const gSettings = guildsSettings[newMember.guild.id];
    const biggestVoiceChannel = newMember.guild.channels.cache
      .array()
      .filter(el => el.type === 'voice')
      .sort((a, b) => getChannelMembers(b).length - getChannelMembers(a).length)[0];
    if (getChannelMembers(biggestVoiceChannel).length) {
      if (gSettings.autojoin && biggestVoiceChannel.id !== newMember.guild.voice?.channel?.id)
        await biggestVoiceChannel.join();
    } else oldMember.channel.leave();
    setTimeout(() => {
      if (
        gSettings.nicknameAnnouncements &&
        newMember.channel &&
        newMember.channel.id === newMember.guild.voice?.channel?.id &&
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
function changeLanguageDialog(channel) {
  const gSettings = guildsSettings[channel.guild.id];
  channel.send('Choose language:').then(message =>
    Promise.all(
      Object.values(tranlations).map(t => message.react(client.emojis.cache.find(emoji => emoji.name === t.flag))),
    ).then(() => {
      function listener(reaction,user) {
        if(reaction.emoji.name)
      }
      client.on('messageReactionAdd');
    }),
  );
}
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
    language: 'en',
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
