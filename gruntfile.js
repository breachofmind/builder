/**
 * Example gruntfile for this project.
 * Can be a suitable default.
 * @author Mike Adamczyk <mike@bom.us>
 *
 * tasks:
 * grunt (default)
 * grunt --use name (runs default task for named configuration)
 * grunt production (runs production tasks only)
 * grunt watch (for development, livereload is enabled)
 */
var builder = require('./build'),
    inspect = require('util').inspect,
    initConfig = {},
    $;

module.exports = function(grunt) {

    $ = builder.init(grunt);

    /**
     * <concat>
     */
    initConfig['concat'] = {
        options: {separator:";\n"},
        src: $.collection('js-src').toObject(),
        lib: $.collection('js-lib').toObject()
    };
    $.tasks('concat:lib');
    $.tasks('concat:src');


    /**
     * <compass>
     */
    initConfig['compass'] = {
        dist: {
            options: {
                sassDir: 'resources/assets/scss',
                cssDir:  'public/static',
                //importPath: $.import()
            }
        }
    };
    $.tasks('compass');


    /**
     * <watch>
     */
    initConfig['watch'] = {
        scripts: {
            files: $.collection('js-src').list(),
            tasks: ['concat:src'],
            options: {livereload:true}
        },
        scss: {
            files: ['resources/assets/scss/**/*.scss'],
            tasks: ['compass'],
            options: {livereload:true}
        },
        blade: {
            files: ['resources/assets/views/**/*.php'],
            options: {livereload:true}
        }
    };


    /**
     * <autoprefixer>
     */
    if ($.has('css')) {

        initConfig['autoprefixer'] = $.collection('css').prefixOverwrite();
        $.tasks('autoprefixer');
    }


    /**
     * <react>
     */
    if ($.has('jsx')) {

        initConfig['react'] = {
            src: {
                files: $.collection('jsx').prefix()
            }
        };

        // Add a watch task, too.
        initConfig['watch'].react = {
            files: $.collection('jsx').list(),
            tasks: ['react:src'],
            options: {livereload:true}
        };
        $.tasks('react:src');
    }

    /**
     * <uglify>
     * For production task only.
     */
    initConfig['uglify'] = {
        src: {
            files: $.collection('js-src').prefix(function(file) {
                return [file.basename,'min',file.extension].concat(".");
            })
        },
        lib: {
            files: $.collection('js-lib').prefix(function(file) {
                return [file.basename,'min',file.extension].concat(".");
            })
        }
    };

    /**
     * <cssmin>
     * For production task only.
     */
    initConfig['cssmin'] = {
        src: {
            files: $.collection('css').prefixOverwrite(function(file) {
                return [file.basename,'min',file.extension].concat(".");
            })
        }
    };

    //console.log (inspect(initConfig,true,10));

    grunt.initConfig(initConfig);

    // Node modules to load.
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-react');

    grunt.registerTask('default', $.tasks());

    grunt.registerTask('production', 'Minify files for production.', ['uglify:lib','uglify:src','cssmin']);
};