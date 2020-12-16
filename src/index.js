const Discord = require('discord.js');
const fs = require('fs');
const Utils = require('./utils');
const discordEmojis = require('./discord_emojis.json');

// Creating files
if (!fs.existsSync(__dirname + '/settings.json')) {
  console.log('Created settings.json\nDONT FORGET TO ADD YOUR TOKEN');
  Utils.writeJSON(
    {
      token: '',
      prefix: 'Randobot',
      saveGuildsSettingsInterval: 10000,
      defaultLanguage: 'en',
    },
    __dirname + '/settings.json',
  );
}
const settings = Utils.readJSON(__dirname + '/settings.json');
const tranlations = {};
fs.readdirSync(__dirname + '/translations').forEach(lang => {
  const file = Utils.readJSON(__dirname + '/translations/' + lang);
  tranlations[file.name] = file;
});
Object.keys(tranlations).forEach(
  k => (tranlations[k] = { ...tranlations[settings.defaultLanguage], ...tranlations[k] }),
);
if (!fs.existsSync(__dirname + '/guildsSettings.json')) Utils.writeJSON({}, __dirname + '/guildsSettings.json');
const guildsSettings = Utils.readJSON(__dirname + '/guildsSettings.json');

const client = new Discord.Client();
const guildsIntevals = {};

const sendMsg = (channel, msg, deleteAfter) =>
  channel.send(msg).then(message => deleteAfter > 0 && message.delete({ timeout: deleteAfter * 1000 }).catch(e => {}));
const getGuildVC = id => client.voice.connections.get(id);
const getChannelMembers = channel => channel.members.array().filter(el => !el.user.bot);

const events = {
  dl: {
    title: 'Deaf lagging',
    voice: true,
    handler: (guild, connection) => {
      const members = getChannelMembers(connection.channel);
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
  },
  cs: {
    title: 'Channel swapping',
    voice: true,
    handler: (guild, connection) => {
      const members = getChannelMembers(connection.channel);
      const victim = members[Math.floor(members.length * Math.random())];
      if (!victim) return;
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
  },
  cum: {
    title: 'CUM',
    voice: true,
    handler: (guild, connection) => {
      const sounds = fs.readdirSync(__dirname + '/audio/cum');
      let play = true;
      function playRandom() {
        connection
          .play(__dirname + '/audio/cum/' + sounds[Math.floor(sounds.length * Math.random())])
          .once('finish', () => play && playRandom());
      }
      playRandom();
      setTimeout(() => (play = false), 10000 + Math.floor(Math.random() * 50000));
    },
  },
  lb: {
    title: 'Low bitrate',
    voice: true,
    handler: (guild, connection) => {
      const originalBitrate = connection.channel.bitrate;
      connection.channel.setBitrate(8000);
      setTimeout(() => connection.channel.setBitrate(originalBitrate), 10000 + Math.floor(Math.random() * 50000));
    },
  },
};

function eventLoop(guildId) {
  try {
    const guild = client.guilds.cache.get(guildId);
    const gSettings = guildsSettings[guildId];
    const connection = getGuildVC(guildId);
    const eventCodes = Object.keys(events).filter(
      k => !gSettings.de.includes(k) && ((events[k].voice && connection) || !events[k].voice),
    );
    if (!eventCodes.length) return;
    events[eventCodes[Math.floor(eventCodes.length * Math.random())]].handler(guild, connection);
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
  leftGuilds.forEach(id => guildDelete(id));
  console.log(`Guilds: ${Object.keys(guildsSettings).length}`);
  Object.keys(guildsSettings).forEach(guild => {
    console.log(client.guilds.cache.get(guild).name);
    if (!guildsIntevals[guild])
      guildsIntevals[guild] = setInterval(() => eventLoop(guild), guildsSettings[guild].ei * 60 * 1000);
  });
  Utils.writeJSON(guildsSettings, __dirname + '/guildsSettings.json');
  setInterval(
    () => Utils.writeJSON(guildsSettings, __dirname + '/guildsSettings.json'),
    settings.saveGuildsSettingsInterval,
  );
  client.user.setActivity(settings.prefix, { type: 'LISTENING' });
});
client.on('message', async msg => {
  try {
    if (
      (!msg.content.startsWith(settings.prefix) && !msg.mentions.has(client.user)) ||
      msg.author.bot ||
      msg.channel.type === 'dm'
    )
      return;
    const message = msg.content.slice(msg.content.indexOf(' ') + 1);
    const gSettings = guildsSettings[msg.guild.id];
    const words = tranlations[gSettings.l || settings.defaultLanguage];
    const send = data => sendMsg(msg.channel, data, gSettings.dmt);
    if (gSettings.dmt > 0) msg.delete({ timeout: gSettings.dmt * 1000 }).catch(e => {});
    if (message === words['cmd events']) {
      send(
        new Discord.MessageEmbed()
          .setColor('#0099ff')
          .setTitle('Events')
          .addFields(
            ...Object.keys(events).map(k => ({
              name: `${events[k].title} - ${gSettings.de.includes(k) ? words.disabled : words.enabled}`,
              value: words[k + ' description'],
            })),
          ),
      );
    } else if (message === words['cmd events enable']) {
      gSettings.de = [];
      send(words['all events enabled']);
    } else if (message === words['cmd events disable']) {
      gSettings.de = Object.keys(events);
      send(words['all events disabled']);
    } else if (message.startsWith(words['cmd events disable event'])) {
      const eventName = message.replace(words['cmd events disable event'], '');
      const eventCode = Object.keys(events).find(k => events[k].title === eventName);
      if (!eventCode) return send(words['no event with name']);
      if (!gSettings.de.includes(eventCode)) gSettings.de.push(eventCode);
      send(words['event disabled'].replace('$eventName', eventName));
    } else if (message.startsWith(words['cmd events enable event'])) {
      const eventName = message.replace(words['cmd events enable event'], '');
      const eventCode = Object.keys(events).find(k => events[k].title === eventName);
      if (!eventCode) return send(words['no event with name']);
      gSettings.de = gSettings.de.filter(e => e !== eventCode);
      send(words['event enabled'].replace('$eventName', eventName));
    } else if (message.startsWith(words['cmd events interval'])) {
      const interval = parseInt(message.replace(words['cmd events interval'], ''));
      if (interval > 0) {
        gSettings.ei = interval;
        clearInterval(guildsIntevals[msg.guild.id]);
        guildsIntevals[msg.guild.id] = setInterval(() => eventLoop(msg.guild.id), gSettings.ei * 60 * 1000);
        send(words['interval change'].replace('$interval', interval));
      } else send(words['interval number error']);
    } else if (message.startsWith(words['cmd clear chat after'])) {
      const interval = parseInt(message.replace(words['cmd clear chat after'], ''));
      if (interval >= 0) {
        gSettings.dmt = interval;
        if (interval === 0) send(words['chat clear interval 0']);
        else send(words['chat clear interval change'].replace('$interval', interval));
      } else send(words['interval number error']);
    } else if (message === words['cmd autojoin']) {
      gSettings.aj = !gSettings.aj;
      if (gSettings.aj) send(words['autojoin enabled']);
      else send(words['autojoin disabled']);
    } else if (message === words['cmd nickname announcements']) {
      gSettings.na = !gSettings.na;
      if (gSettings.na) send(words['nickname announcements enabled']);
      else send(words['nickname announcements disabled']);
    } else if (message === words['cmd language']) changeLanguageDialog(msg.channel);
    else if (message === words['cmd join']) {
      if (!msg.member.voice?.channelID) return send(words['you are not in voice channel']);
      const connection = getGuildVC(msg.guild.id);
      if (connection) connection.channel.leave();
      msg.member.voice.channel.join();
    } else send(words['help']);
  } catch (e) {
    console.error(e);
  }
});
client.on('voiceStateUpdate', async (oldMember, newMember) => {
  try {
    if (newMember.member.user.bot || oldMember.channelID === newMember.channelID) return;
    const gSettings = guildsSettings[newMember.guild.id];
    let connection = getGuildVC(newMember.guild.id);
    if (gSettings.aj) {
      const VCs = newMember.guild.channels.cache.array().filter(el => el.type === 'voice');
      const VCmembers = VCs.map(vc => getChannelMembers(vc).length);
      const biggsetVCi = VCs.map((_, i) => i).sort((a, b) => VCmembers[b] - VCmembers[a])[0];
      if (
        VCmembers[biggsetVCi] &&
        (!connection || connection.channel.id !== newMember.channelID) &&
        VCs[biggsetVCi].id === newMember.channelID
      ) {
        if (connection) {
          oldMember.channel.leave();
          await Utils.wait(1000);
        }
        connection = await VCs[biggsetVCi].join();
      }
    }
    if (connection) {
      if (connection.channel.id === newMember.channelID) {
        if (gSettings.na) {
          await Utils.wait(500);
          connection.play(__dirname + `/audio/nicknameAnnouncements/${newMember.member.user.id}.mp3`);
        }
      } else if (!getChannelMembers(connection.channel).length) connection.channel.leave();
    }
  } catch (e) {
    console.error(e);
  }
});
async function changeLanguageDialog(channel) {
  try {
    const gSettings = guildsSettings[channel.guild.id];
    const message = await channel.send('Choose language:');
    const flags = Object.values(tranlations).map(t => discordEmojis[t.flag]);
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
    message.delete().catch(e => {});
    gSettings.l = Object.values(tranlations)[flags.indexOf(reaction)].name;
  } catch (e) {
    console.error(e);
  }
}
function guildCreate(guild) {
  guildsSettings[guild.id] = {
    //disabled events
    de: [],
    // deleteMessagesTimeout
    dmt: 60,
    // autojoin
    aj: 1,
    // nicknameAnnouncements
    na: 1,
    // eventsInterval
    ei: 60,
    // language
    l: 'en',
  };
  //guild.channels.cache.array()[0].send(translation.en.help);
  guildsIntevals[guild.id] = setInterval(() => eventLoop(guild.id), 60 * 60 * 1000);
}
client.on('guildCreate', guildCreate);
function guildDelete(id) {
  delete guildsSettings[id];
  clearInterval(guildsIntevals[id]);
  delete guildsIntevals[id];
}
client.on('guildDelete', guildDelete);
client.login(settings.token);
