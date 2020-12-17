const fs = require('fs/promises');
const readJSON = async filePath => JSON.parse(await fs.readFile(filePath));
let client;
const utils = {
  client,
  sendMsg: (channel, data, deleteAfter) =>
    channel
      .send(data)
      .then(message => deleteAfter > 0 && message.delete({ timeout: deleteAfter * 1000 }).catch(e => {})),
  getGuildVC: id => utils.client.voice.connections.get(id),
  getChannelMembers: channel => channel.members.array().filter(el => !el.user.bot),
  emojis: require('./discord_emojis.json'),
  writeJSON: async (json, filePath) => await fs.writeFile(filePath, JSON.stringify(json)),
  readJSON,
  fileExists: p =>
    new Promise(r => {
      try {
        fs.stat(p).then(() => r(true));
      } catch {
        r(false);
      }
    }),
  wait: t => new Promise(r => setTimeout(r, t)),
};
module.exports = utils;
