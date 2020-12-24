const fs = require('fs');
const Utils = require('../utils');
const dirname = __dirname.slice(0, __dirname.replace(/\\/g, '/').lastIndexOf('/')) + '/audio/cum/';
const sounds = fs.readdirSync(dirname);
module.exports = {
  id: 'cum',
  title: 'CUM',
  voice: true,
  event: 'loop',
  handler: async guild => {
    console.log(`CUM: <${guild.name}>`);
    const connection = Utils.getGuildVC(guild.id);
    let play = true;
    function playRandom() {
      connection
        .play(dirname + sounds[Math.floor(sounds.length * Math.random())])
        .once('finish', () => play && playRandom());
    }
    playRandom();
    setTimeout(() => (play = false), 10000 + Math.floor(Math.random() * 50000));
  },
};
