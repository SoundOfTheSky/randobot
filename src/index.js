const Discord = require('discord.js');
const fs = require('fs/promises');
const Utils = require('./utils');
const eventLoop = require('./eventLoop');
const client = new Discord.Client();
Utils.client = client;
client.once('ready', async () => {
  console.log('Logged in!');
  /* STARTUP CONFIGURATION */
  client.translations = Object.fromEntries(
    await Promise.all(
      (await fs.readdir(__dirname + '/translations')).map(async f => {
        const file = await Utils.readJSON(__dirname + '/translations/' + f);
        return [f.replace('.json', ''), file];
      }),
    ),
  );
  Object.keys(client.translations).forEach(
    k =>
      (client.translations[k] = { ...client.translations[client.settings.defaultLanguage], ...client.translations[k] }),
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
    for (const guild of guildsAreIn) {
      const found = leftGuilds.indexOf(guild.id);
      if (found > -1) leftGuilds.splice(found, 1);
      else await guildCreate(guild.id);
    }
    leftGuilds.forEach(id => guildDelete(id));
    console.log(`Guilds: ${Object.keys(client.guildsSettings).length}`);
    Object.keys(client.guildsSettings).forEach(guild => {
      console.log(client.guilds.cache.get(guild).name);
      if (!client.guildsIntevals[guild]) {
        const gSettings = client.guildsSettings[guild];
        client.guildsIntevals[guild] = setInterval(() => eventLoop(guild), gSettings.ei * 60 * 1000);
      }
    });
    await Utils.writeJSON(client.guildsSettings, __dirname + '/guildsSettings.json');
    setInterval(
      () => Utils.writeJSON(client.guildsSettings, __dirname + '/guildsSettings.json'),
      client.settings.saveGuildsSettingsInterval,
    );
  }
  async function guildCreate(id) {
    console.log('Guild create: ' + id);
    try {
      const guild = client.guilds.cache.get(id);
      if (!guild.me.hasPermission('ADMINISTRATOR')) {
        setImmediate(async () => {
          await (await client.users.fetch(guild.ownerID)).send(
            `Bot requires admin permissions. Invite with a link: ` +
              (await client.generateInvite({
                permissions: ['ADMINISTRATOR'],
              })),
          );
          guild.leave();
        });
      } else {
        client.guildsSettings[id] = {
          //disabled events
          de: [],
          // deleteMessagesTimeout
          dmt: 60,
          // autojoin
          aj: 1,
          // eventsInterval
          ei: 60,
          // language
          l: 'en',
          // only admin can
          //oa: 0,
        };
        //guild.channels.cache.array()[0].send(translation.en.help);
        client.guildsIntevals[id] = setInterval(() => eventLoop(id), 60 * 60 * 1000);
        client.user.setActivity(
          `${client.settings.prefix} or @ on ${Object.keys(client.guildsSettings).length} servers`,
          {
            type: 'LISTENING',
          },
        );
      }
    } catch (e) {
      console.log(e);
    }
  }
  function guildDelete(id) {
    console.log('Guild delete: ' + id);
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
      if (msg.channel.type === 'dm') return;
      const gSettings = client.guildsSettings[msg.guild.id];
      client.events.forEach(
        e =>
          e.event === 'message' &&
          !gSettings.de.includes(e.id) &&
          (!e.voice || connection) &&
          e.handler(msg) &&
          (!gSettings.oa || msg.member.hasPermission('BAN_MEMBERS')),
      );
      if ((!msg.content.startsWith(client.settings.prefix) && !msg.mentions.has(client.user)) || msg.author.bot) return;
      if (Math.random() < 0.01) {
        client.user.setActivity(`you scream in agony`, { type: 'LISTENING' });
        setTimeout(
          () =>
            client.user.setActivity(
              `${client.settings.prefix} or @ on ${Object.keys(client.guildsSettings).length} servers`,
              {
                type: 'LISTENING',
              },
            ),
          1000 * 60 * 10,
        );
      }
      const message = msg.content.slice(msg.content.indexOf(' ') + 1);
      const words = client.translations[gSettings.l || client.settings.defaultLanguage];
      if (gSettings.dmt > 0) msg.delete({ timeout: gSettings.dmt * 1000 }).catch(e => {});
      const cmd = client.commands
        .filter(c => message.startsWith(words[c.name]))
        .sort((a, b) => b.name.length - a.name.length)[0];
      if (cmd) cmd.handler(msg, gSettings, words, message.replace(words[cmd.name], '').trim());
      else
        Utils.sendMsg(
          msg.channel,
          new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(words['commands title'])
            .addFields(
              ...client.commands.map(cmd => ({
                name: words[cmd.name + ' title'],
                value: words[cmd.name + ' description'],
              })),
            ),
          gSettings.dmt,
        );
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
      if (connection && !Utils.getChannelMembers(connection.channel).length) connection.channel.leave();
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
        prefix: '!rb',
        saveGuildsSettingsInterval: 3600000,
        defaultLanguage: 'en',
      },
      __dirname + '/settings.json',
    );
  }
  client.settings = await Utils.readJSON(__dirname + '/settings.json');
  client.login(client.settings.token);
});
