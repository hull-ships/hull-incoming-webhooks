const _ = require("lodash");
const glob = require("glob");
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const getFiles = source => glob.sync(`${path.resolve(source)}/*.{js,jsx}`);
const getEntry = files =>
  _.reduce(
    files,
    (m, v) => {
      m[
        v
          .split("/")
          .pop()
          .replace(/.(js|jsx)/, "")
      ] = v;
      return m;
    },
    {}
  );

const getPlugins = mode =>
  mode === "development"
    ? [new MiniCssExtractPlugin({ filename: "[name].css" })]
    : [new MiniCssExtractPlugin({ filename: "[name].css" })];

const buildConfig = ({ files, destination, mode = "production" }) => ({
  mode,
  entry: getEntry(files),
  devtool: mode === "production" ? "source-map" : "inline-source-map",
  output: {
    path: path.resolve(destination),
    filename: "[name].js",
    publicPath: "/"
  },

  resolve: {
    modules: [`${process.cwd()}/src`, "node_modules"],
    extensions: [".js", ".jsx", ".css", ".scss"]
  },
  module: {
    rules: [
      {
        enforce: "pre",
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: "eslint-loader"
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              ["@babel/preset-env", { modules: false }],
              "@babel/preset-react"
            ],
            plugins: ["lodash", "react-hot-loader/babel"]
          }
        }
      },
      // svg
      { test: /.svg$/, loader: "svg-inline-loader" },
      // images & other files
      {
        test: /\.jpe?g$|\.gif$|\.png|\.woff$|\.ttf$|\.wav$|\.mp3$/,
        loader: "file-loader"
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
      }
    ]
  },
  plugins: getPlugins(mode)
});

module.exports = ({ source, destination, mode }) => {
  const files = getFiles(source);
  if (!files || !files.length) {
    return undefined;
  }
  return buildConfig({ files, destination, mode });
};
