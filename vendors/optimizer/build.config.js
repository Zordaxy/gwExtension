({
    name: "init",
    baseUrl: "../../src/js/",
    mainConfigFile: "../../src/js/init.js",
    out: "../../dist/main.min.js",
    generateSourceMaps: true,
    preserveLicenseComments: false,
    // optimize: "none"
    optimize: "uglify2"
})
