const Discord = require('discord.js');
const fs = require('fs/promises');
const Utils = require('./utils');
const eventLoop = require('./eventLoop');
const client = new Discord.Client();
Utils.client = client;
client.once('ready', async () => {
  console.log('Logged in!');
  /* STARTUP CONFIGURATION */
  client.tranlations = Object.fromEntries(
    await Promise.all(
      (await fs.readdir(__dirname + '/translations')).map(async f => {
        const file = await Utils.readJSON(__dirname + '/translations/' + f);
        return [f.replace('.json', ''), file];
      }),
    ),
  );
  Object.keys(client.tranlations).forEach(
    k => (client.tranlations[k] = { ...client.tranlations[client.settings.defaultLanguage], ...client.tranlations[k] }),
  );
  if (!(await Utils.fileExists(__dirname + '/guildsSettings.json')))
    await Utils.writeJSON({}, __dirname + '/guildsSettings.json');
  client.guildsSettings = await Utils.readJSON(__dirname + '/guildsSettings.json');
  client.guildsIntevals = {};
  client.events = (await fs.readdir(__dirname + '/events')).map(module => require('./events/' + module));
  (client.commands = (await fs.readdir(__dirname + '/commands')).map(module => require('./commands/' + module))),
    await syncGuilds();
  // Function
  async function syncGuilds() {
    const guildsAreIn = client.guilds.cache.array();
    const leftGuilds = Object.keys(client.guildsSettings);
    guildsAreIn.forEach(guild => {
      const found = leftGuilds.indexOf(guild.id);
      if (found > -1) leftGuilds.splice(found, 1);
      else guildCreate(guild.id);
    });
    leftGuilds.forEach(id => guildDelete(id));
    console.log(`Guilds: ${Object.keys(client.guildsSettings).length}`);
    Object.keys(client.guildsSettings).forEach(guild => {
      console.log(client.guilds.cache.get(guild).name);
      if (!client.guildsIntevals[guild])
        client.guildsIntevals[guild] = setInterval(() => eventLoop(guild), client.guildsSettings[guild].ei * 60 * 1000);
    });
    await Utils.writeJSON(client.guildsSettings, __dirname + '/guildsSettings.json');
    setInterval(
      () => Utils.writeJSON(client.guildsSettings, __dirname + '/guildsSettings.json'),
      client.settings.saveGuildsSettingsInterval,
    );
  }
  function guildCreate(id) {
    client.guildsSettings[id] = {
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
    client.guildsIntevals[id] = setInterval(() => eventLoop(id), 60 * 60 * 1000);
    client.user.setActivity(`${client.settings.prefix} or @ on ${Object.keys(client.guildsSettings).length} servers`, {
      type: 'LISTENING',
    });
  }
  function guildDelete(id) {
    delete client.guildsSettings[id];
    clearInterval(client.guildsIntevals[id]);
    delete client.guildsIntevals[id];
    client.user.setActivity(`${client.settings.prefix} or @ on ${Object.keys(client.guildsSettings).length} servers`, {
      type: 'LISTENING',
    });
  }
  // Events
  client.on('message', async msg => {
    try {
      if (
        (!msg.content.startsWith(client.settings.prefix) && !msg.mentions.has(client.user)) ||
        msg.author.bot ||
        msg.channel.type === 'dm'
      )
        return;
      const message = msg.content.slice(msg.content.indexOf(' ') + 1);
      const gSettings = client.guildsSettings[msg.guild.id];
      const words = client.tranlations[gSettings.l || client.settings.defaultLanguage];
      if (gSettings.dmt > 0) msg.delete({ timeout: gSettings.dmt * 1000 }).catch(e => {});
      const cmd = client.commands
        .filter(c => message.startsWith(words[c.name]))
        .sort((a, b) => b.name.length - a.name.length)[0];
      if (cmd) cmd.handler(msg, gSettings, words, message.replace(words[cmd.name], '').trim());
      else Utils.sendMsg(msg.channel, words['help'], gSettings.dmt);
    } catch (e) {
      console.error(e);
    }
  });
  client.on('voiceStateUpdate', async (oldMember, newMember) => {
    try {
      if (newMember.member.user.bot || oldMember.channelID === newMember.channelID) return;
      const gSettings = client.guildsSettings[newMember.guild.id];
      let connection = Utils.getGuildVC(newMember.guild.id);
      if (gSettings.aj) {
        const VCs = newMember.guild.channels.cache.array().filter(el => el.type === 'voice');
        const VCmembers = VCs.map(vc => Utils.getChannelMembers(vc).length);
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
        } else if (!Utils.getChannelMembers(connection.channel).length) connection.channel.leave();
      }
    } catch (e) {
      console.error(e);
    }
  });
  client.on('guildCreate', g => guildCreate(g.id));
  client.on('guildDelete', g => guildDelete(g.id));
  client.user.setActivity(`${client.settings.prefix} or @ on ${Object.keys(client.guildsSettings).length} servers`, {
    type: 'LISTENING',
  });
});
Utils.fileExists(__dirname + '/settings.json').then(async exists => {
  if (!exists) {
    console.log('Created settings.json\nDONT FORGET TO ADD YOUR TOKEN');
    await Utils.writeJSON(
      {
        token: '',
        prefix: 'Randobot',
        saveGuildsSettingsInterval: 3600000,
        defaultLanguage: 'en',
      },
      __dirname + '/settings.json',
    );
  }
  client.settings = await Utils.readJSON(__dirname + '/settings.json');
  client.login(client.settings.token);
});
