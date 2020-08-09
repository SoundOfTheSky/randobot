require('fs').writeFileSync(__dirname + '/Bindex.js', require('@babel/core').transformFileSync('index.js').code);
