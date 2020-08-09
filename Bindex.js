"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var Discord = require('discord.js');

var fs = require('fs');

var Utils = require('./utils');

var help = "Hi! I'm probably most annoying bot in the universe.\nHowever you can change my behavior by this commands:\n\nevents - List of events\nevents enable/disable - enable/disable all events\nevents enable/disable [name of event] - enable/disable specific event\nevents interval [number] - set interval between events in minutes. Default: 90\nautojoin - toggle autojoin to voice channels\nnickname announcements - toggle nickname announcements\nclear chat after [number] - After how many seconds bot will delete messages related to him. Default: 600. If set 0 will never delete messages.\n";

if (!fs.existsSync(__dirname + '/settings.json')) {
  console.log('Created settings.json', 'DONT FORGET TO ADD YOUR TOKEN');
  Utils.writeJSON({
    token: '',
    prefix: 'Randobot',
    saveGuildsSettingsInterval: 10000
  }, __dirname + '/settings.json');
}

if (!fs.existsSync(__dirname + '/guildsSettings.json')) Utils.writeJSON({}, __dirname + '/guildsSettings.json');
var settings = Utils.readJSON(__dirname + '/settings.json');
var guildsSettings = Utils.readJSON(__dirname + '/guildsSettings.json');
var client = new Discord.Client();
var guildsIntevals = {};
var eventsDescription = {
  'Deaf lagging': 'Will toggle deafen for one random victim in voice for 30 seconds.',
  'Channel swapping': "Selects a random victim in the voice channel and starts sending it to random channels for 30 seconds. The victim will then return to the original channel.",
  'Random audio memes': 'Welcome to the cum zone'
};

function eventLoop(guild) {
  try {
    var gSettings = guildsSettings[guild.id];
    var events = [];
    Object.keys(gSettings.events).forEach(function (el) {
      if (gSettings.events[el]) events.push(el);
    });

    switch (events[Math.floor(events.length * Math.random())]) {
      case 'Deaf lagging':
        {
          var _guild$voice;

          if ((_guild$voice = guild.voice) === null || _guild$voice === void 0 ? void 0 : _guild$voice.channel) {
            var members = getChannelMembers(guild.voice.channel);
            var victim = members[Math.floor(members.length * Math.random())];
            if (!victim) return;
            console.log('deafing ' + victim.user.username);
            var interval = setInterval(function () {
              if (victim.voice) victim.voice.setDeaf(!victim.voice.deaf);
            }, 2000);
            setTimeout(function () {
              console.log('End of deafing');
              clearInterval(interval);
              if (victim.voice) victim.voice.setDeaf(false);
            }, 30000);
            gi;
          }

          break;
        }

      case 'Channel swapping':
        {
          var _guild$voice2;

          if ((_guild$voice2 = guild.voice) === null || _guild$voice2 === void 0 ? void 0 : _guild$voice2.channel) {
            var _members = getChannelMembers(guild.voice.channel);

            var _victim = _members[Math.floor(_members.length * Math.random())];

            if (!_victim) return;
            console.log('channelSwapping ' + _victim.user.username);
            var originalChannel = _victim.voice.channel;

            var _interval = setInterval(function () {
              var channels = _victim.guild.channels.cache.array().filter(function (el) {
                return el.type === 'voice';
              });

              if (_victim.voice) _victim.voice.setChannel(channels[Math.floor(channels.length * Math.random())]);
            }, 2000);

            setTimeout(function () {
              console.log('End of channelSwapping');
              clearInterval(_interval);
              if (_victim.voice) _victim.voice.setChannel(originalChannel);
            }, 30000);
          }

          break;
        }

      case 'Random audio memes':
        {
          var _guild$voice3;

          if ((_guild$voice3 = guild.voice) === null || _guild$voice3 === void 0 ? void 0 : _guild$voice3.channel) {
            var playRandom = function playRandom() {
              if (guild.voice && play) guild.voice.connection.play(__dirname + '/audio/random/' + sounds[Math.floor(sounds.length * Math.random())]).once('finish', function () {
                return playRandom();
              });
            };

            var _members2 = getChannelMembers(guild.voice.channel);

            if (_members2.length === 0) return;
            var sounds = fs.readdirSync(__dirname + '/audio/random');
            var play = true;
            console.log('Playing random audio memes');
            playRandom();
            setTimeout(function () {
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

client.once('ready', function () {
  console.log('Logged in!'); // Sync guilds

  var guildsAreIn = client.guilds.cache.array();
  var leftGuilds = Object.keys(guildsSettings);
  guildsAreIn.forEach(function (guild) {
    var found = leftGuilds.indexOf(guild.id);
    if (found > -1) leftGuilds.splice(found, 1);else guildCreate(guild);
  });
  leftGuilds.forEach(function (guild) {
    return guildDelete(client.guilds.cache.get(guild));
  });
  console.log("Guilds: ".concat(Object.keys(guildsSettings).length));
  Object.keys(guildsSettings).forEach(function (guild) {
    console.log(client.guilds.cache.get(guild).name);
    if (!guildsIntevals[guild]) guildsIntevals[guild] = setInterval(function () {
      return eventLoop(client.guilds.cache.get(guild));
    }, guildsSettings[guild].eventsInterval * 60 * 1000);
  });
  Utils.writeJSON(guildsSettings, __dirname + '/guildsSettings.json');
  setInterval(function () {
    return Utils.writeJSON(guildsSettings, __dirname + '/guildsSettings.json');
  }, settings.saveGuildsSettingsInterval);
});
client.on('message', function (msg) {
  try {
    if (!msg.content.startsWith(settings.prefix) || msg.author.bot || msg.channel.type === 'dm') return;
    var message = msg.content.replace(settings.prefix + ' ', '');
    var gSettings = guildsSettings[msg.guild.id];

    var sendMsg = function sendMsg(data) {
      msg.channel.send(data).then(function (message) {
        return gSettings.deleteMessagesTimeout > 0 && message["delete"]({
          timeout: gSettings.deleteMessagesTimeout * 1000
        })["catch"](function (e) {});
      });
    };

    if (gSettings.deleteMessagesTimeout > 0) msg["delete"]({
      timeout: gSettings.deleteMessagesTimeout * 1000
    })["catch"](function (e) {});

    if (message === 'events') {
      var _Discord$MessageEmbed;

      var events = [];
      Object.keys(guildsSettings[msg.guild.id].events).forEach(function (event) {
        return events.push({
          name: event + ' - ' + (guildsSettings[msg.guild.id].events[event] ? 'Enabled' : 'Disabled'),
          value: eventsDescription[event]
        });
      });
      sendMsg((_Discord$MessageEmbed = new Discord.MessageEmbed().setColor('#0099ff').setTitle('Events')).addFields.apply(_Discord$MessageEmbed, events));
    } else if (message === 'events enable') {
      Object.keys(gSettings.events).forEach(function (event) {
        return gSettings.events[event] = true;
      });
      sendMsg("All events are now enabled!");
    } else if (message === 'events disable') {
      Object.keys(gSettings.events).forEach(function (event) {
        return gSettings.events[event] = false;
      });
      sendMsg("All events are now disabled!");
    } else if (message.startsWith('events enable ')) {
      var eventName = message.replace('events enable ', '');
      if (!Object.keys(gSettings.events).includes(eventName)) return sendMsg('There are no events with that name');
      gSettings.events[eventName] = true;
      sendMsg("Event \"".concat(eventName, "\" is now enabled and can happen at any moment"));
    } else if (message.startsWith('events disable ')) {
      var _eventName = message.replace('events disable ', '');

      if (!Object.keys(gSettings.events).includes(_eventName)) return sendMsg('There are no events with that name');
      gSettings.events[_eventName] = false;
      sendMsg("Event \"".concat(_eventName, "\" is now disabled and will never happen until somebody enables it"));
    } else if (message.startsWith('events interval ')) {
      var interval = parseInt(message.replace('events interval ', ''));

      if (interval > 0) {
        gSettings.eventsInterval = interval;
        clearInterval(guildsIntevals[msg.guild.id]);
        guildsIntevals[msg.guild.id] = setInterval(function () {
          return eventLoop(msg.guild);
        }, gSettings.eventsInterval * 60 * 1000);
        sendMsg("Events will now happen every ".concat(interval, " min!"));
      } else sendMsg('Interval must be a positive number');
    } else if (message.startsWith('clear chat after ')) {
      var _interval2 = parseInt(message.replace('clear chat after ', ''));

      if (_interval2 >= 0) {
        gSettings.deleteMessagesTimeout = _interval2;
        if (_interval2 === 0) sendMsg('Bot will now not delete messages.');else sendMsg("Bot will now delete messages after ".concat(_interval2, " seconds!"));
      } else sendMsg('Interval must be a positive number');
    } else if (message === 'autojoin') {
      gSettings.autojoin = !gSettings.autojoin;
      if (gSettings.autojoin) sendMsg('Now bot will automatically join to voice channels!');else sendMsg('Now bot will not join voice channels!');
    } else if (message === 'nickname announcements') {
      gSettings.nicknameAnnouncements = !gSettings.nicknameAnnouncements;
      if (gSettings.nicknameAnnouncements) sendMsg('Now bot will say nicknames of people that just joined voice channel!');else sendMsg('Now bot will remain silent!');
    } else sendMsg(help);
  } catch (e) {
    console.error(e);
  }
});
client.on('voiceStateUpdate', /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(oldMember, newMember) {
    var gSettings, biggestVoiceChannel, _newMember$guild$voic, _newMember$guild$voic2;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            if (!newMember.member.user.bot) {
              _context.next = 3;
              break;
            }

            return _context.abrupt("return");

          case 3:
            gSettings = guildsSettings[newMember.guild.id];
            biggestVoiceChannel = newMember.guild.channels.cache.array().filter(function (el) {
              return el.type === 'voice';
            }).sort(function (a, b) {
              return getChannelMembers(b).length - getChannelMembers(a).length;
            })[0];

            if (!getChannelMembers(biggestVoiceChannel).length) {
              _context.next = 11;
              break;
            }

            if (!(gSettings.autojoin && biggestVoiceChannel.id !== ((_newMember$guild$voic = newMember.guild.voice) === null || _newMember$guild$voic === void 0 ? void 0 : (_newMember$guild$voic2 = _newMember$guild$voic.channel) === null || _newMember$guild$voic2 === void 0 ? void 0 : _newMember$guild$voic2.id))) {
              _context.next = 9;
              break;
            }

            _context.next = 9;
            return biggestVoiceChannel.join();

          case 9:
            _context.next = 12;
            break;

          case 11:
            oldMember.channel.leave();

          case 12:
            setTimeout(function () {
              var _newMember$guild$voic3, _newMember$guild$voic4;

              if (gSettings.nicknameAnnouncements && newMember.channel && newMember.channel.id === ((_newMember$guild$voic3 = newMember.guild.voice) === null || _newMember$guild$voic3 === void 0 ? void 0 : (_newMember$guild$voic4 = _newMember$guild$voic3.channel) === null || _newMember$guild$voic4 === void 0 ? void 0 : _newMember$guild$voic4.id) && (!oldMember.channel || oldMember.channel.id !== newMember.channel.id)) {
                var connection = getChannelVoiceConnection(newMember.channel);
                if (connection) connection.play(__dirname + "/audio/nicknameAnnouncements/".concat(newMember.member.user.id, ".mp3")); //eventLoop(newMember.guild);
              }
            }, 500);
            _context.next = 18;
            break;

          case 15:
            _context.prev = 15;
            _context.t0 = _context["catch"](0);
            console.error(_context.t0);

          case 18:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 15]]);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}());

function guildCreate(guild) {
  guildsSettings[guild.id] = {
    events: {
      'Channel swapping': true,
      'Deaf lagging': true,
      'Random audio memes': true
    },
    deleteMessagesTimeout: 600,
    autojoin: true,
    nicknameAnnouncements: true,
    eventsInterval: 90
  };
  guild.channels.cache.array()[0].send(help);
  guildsIntevals[guild.id] = setInterval(function () {
    return eventLoop(guild);
  }, 90 * 60 * 1000);
}

client.on('guildCreate', guildCreate);

function guildDelete(guild) {
  delete guildsSettings[guild.id];
  clearInterval(guildsIntevals[guild.id]);
  delete guildsIntevals[guild.id];
}

client.on('guildDelete', guildDelete);

var getChannelVoiceConnection = function getChannelVoiceConnection(channel) {
  return client.voice.connections.get(channel.guild.id);
};

var getChannelMembers = function getChannelMembers(channel) {
  return channel.members.array().filter(function (el) {
    return !el.user.bot;
  });
};

client.login(settings.token);