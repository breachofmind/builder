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
                sassDir: $.path('scss'),
                cssDir: $.path('static'),
                importPath: $.path('import')
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
            files: [$.path('scss')+'/**/*.scss'],
            tasks: ['compass'],
            options: {livereload:true}
        },
        blade: {
            files: [$.path('views')+'/**/*.php'],
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
            files: $.buildFiles().prefixOverwrite(function(file){
                return file.minified();
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
                return file.minified();
            })
        }
    };

    //console.log (inspect(initConfig,true,10));

    grunt.initConfig(initConfig);

    grunt.registerTask('default', $.tasks());

    grunt.registerTask('production', 'Minify files for production.', ['uglify:src','cssmin']);
};