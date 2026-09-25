const path = require("path");

module.exports = {
  resolve: {
    alias: {
      js: path.resolve(__dirname, "src/js"),
      data: path.resolve(__dirname, "src/data"),
    },
  },
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "https://www.gwars.io/objectedit.php?id=100001",
      },
    },
    clearMocks: true,
    restoreMocks: true,
  },
};
