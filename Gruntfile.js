module.exports = function (grunt) {
    grunt.initConfig({
        exec: {
            run: 'node vendors/optimizer/r.js -o vendors/optimizer/build.config.js'
        },
        uglify: {
            build: {
                src: 'dist/main.min.js',
                dest: 'dist/main.min.js'
            }
        },
        babel: {
            options: {
                sourceMap: false,
                presets: ['@babel/preset-env']
            },
            dist: {
                files: {
                    'dist/main.min.js': 'dist/main.min.js'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-babel');

    grunt.registerTask('default', ['exec'])
    grunt.registerTask('uglification-fails-with-require', ['exec', 'babel', 'uglify']);
};