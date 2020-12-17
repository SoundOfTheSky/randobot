module.exports = {
  id: 'lb',
  title: 'Low bitrate',
  voice: true,
  handler: guild => {
    const connection = Utils.getGuildVC(guild.id);
    const originalBitrate = connection.channel.bitrate;
    connection.channel.setBitrate(8000);
    setTimeout(() => connection.channel.setBitrate(originalBitrate), 10000 + Math.floor(Math.random() * 50000));
  },
};
