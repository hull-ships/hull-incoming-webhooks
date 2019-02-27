const configBuilder = require("./webpack.config");

module.exports = function buildConfig() {
  const config = configBuilder({
    source: `${__dirname}/../src`,
    destination: `${__dirname}/../dist`,
    mode: "production"
  });
  return config;
};
