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
    chalk = require('chalk'),
    inspect = require('util').inspect,
    initConfig = {},
    $;

module.exports = function(grunt) {

    $ = builder.init(grunt);

    if (!$) {
        console.log(chalk.red("\nMissing Build Configuration!"));
        process.exit();
    }

    console.log("\n"+"** Using Build Configuration: "+chalk.green($.name)+" **\n\n");

    /**
     * <concat>
     */
    initConfig['concat'] = {
        options: {separator:";\n"},
        src: {
            dest: $.to('src'),
            src:  $.src()
        },
        lib: {
            dest: $.to('lib'),
            src:  $.lib()
        }
    };
    $.tasks('concat:lib');
    $.tasks('concat:src');


    /**
     * <compass>
     */
    initConfig['compass'] = {
        dist: {
            options: {
                sassDir: $.scss(),
                cssDir:  $.build(),
                importPath: $.import()
            }
        }
    };
    $.tasks('compass');


    /**
     * <watch>
     */
    initConfig['watch'] = {
        scripts: {
            files: $.src(),
            tasks: ['concat:src'],
            options: {livereload:true}
        },
        scss: {
            files: [$.scss('**/*.scss')],
            tasks: ['compass'],
            options: {livereload:true}
        },
        blade: {
            files: [$.view('**/*.php')],
            options: {livereload:true}
        }
    };


    /**
     * <autoprefixer>
     */
    if ($.has('css')) {

        initConfig['autoprefixer'] = $.prefix('css');
        $.tasks('autoprefixer');
    }


    /**
     * <react>
     */
    if ($.has('jsx')) {

        initConfig['react'] = {
            src: {
                files: $.into('jsx')
            }
        };

        // Add a watch task, too.
        initConfig['watch'].react = {
            files: $.jsx(),
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
            files: $.prefixTo('src')
        },
        lib: {
            files: $.prefixTo('lib')
        }
    };

    /**
     * <cssmin>
     * For production task only.
     */
    initConfig['cssmin'] = {
        src: {
            files: $.prefix('css')
        }
    };


    //console.log (inspect(initConfig,true,10));

    grunt.initConfig(initConfig);

    grunt.registerTask('default', $.tasks());

    grunt.registerTask('production', 'Minify files for production.', ['uglify:lib','uglify:src','cssmin']);
};