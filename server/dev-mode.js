/* eslint-disable global-require */
module.exports = function devMode(app, { source, destination }) {
  const _ = require("lodash");
  const webpack = require("webpack");
  const webpackDevMiddleware = require("webpack-dev-middleware");
  const webpackHotMiddleware = require("webpack-hot-middleware");
  // const ProgressBarPlugin = require("progress-bar-webpack-plugin");

  const config = require("../webpack/webpack.config")({
    source,
    destination,
    mode: "development"
  });

  // Early return if no files are found.
  if (!config) {
    return app;
  }

  const entry = _.reduce(
    config.entry,
    (m, v, k) => {
      m[k] = [
        require.resolve("babel-polyfill"),
        require.resolve("react-hot-loader/patch"),
        require.resolve("webpack-hot-middleware/client"),
        v
      ];
      return m;
    },
    {}
  );

  const plugins = [
    new webpack.HotModuleReplacementPlugin(),
    ...config.plugins,
    new webpack.NamedModulesPlugin(),
    // new ProgressBarPlugin({ clear: false }),
    new webpack.NoEmitOnErrorsPlugin()
  ];

  const compiler = webpack({ ...config, entry, plugins });

  app.use(
    webpackDevMiddleware(compiler, {
      hot: true,
      quiet: false,
      overlay: false,
      noInfo: false,
      lazy: false,
      clientLogLevel: "none",
      watchContentBase: true,
      stats: { colors: true },
      watchOptions: {
        ignored: /node_modules/
      },
      historyApiFallback: {
        disableDotRule: true
      },

      headers: { "Access-Control-Allow-Origin": "http://localhost" },
      publicPath: config.output.publicPath
    })
  );
  app.use(webpackHotMiddleware(compiler));
  return app;
};
