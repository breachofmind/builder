var inspect = require('util').inspect,
    chalk = require('chalk');


/**
 * Merges an array into this array.
 * @param array
 * @returns {Array}
 */
Array.prototype.merge = function(array)
{
    if (typeof array == "string") {
        this.push(array);
        return this;
    }
    for (var i=0; i<array.length; i++) {
        this.push(array[i]);
    }
    return this;
};

/**
 * Concatenates only non-empty values with the given sep, or comma by default.
 * @param sep string
 * @returns {string}
 */
Array.prototype.concat = function(sep)
{
    if (!arguments.length) {
        sep = ", ";
    }
    var str = [];
    this.map(function(item) {
        if (!item || item=="") {
            return;
        }
        str.push(item);
    });
    return str.join(sep);
};

/**
 * Replaces {key} with the given value.
 * @param key string
 * @param value string
 * @returns {string}
 */
String.prototype.replaceKey = function(key,value)
{
    var txt = this.toString();
    var find = "{"+key+"}";
    while(txt.search(find) !== -1) {
        txt = txt.replace(find,value);
    }
    return txt;
};


/**
 * File object class.
 * @param name string file name
 * @constructor
 */
function File(name)
{
    var self = this;

    this.basename = null;
    this.extension = null;
    this.dir = null;

    parse(name);

    /**
     * To set a new name for the file.
     * @param name string
     * @returns {File}
     */
    this.set = function(name)
    {
        parse(name);
        return this;
    };

    /**
     * Create a full path to the file.
     * @param manipulator function - optional, adjusts the filename at runtime without changing the basename.
     * @returns {string}
     */
    this.path = function(manipulator)
    {
        var filename = [this.basename,this.extension].concat('.');
        if (manipulator) {
            filename = manipulator(this);
        }
        return [this.dir, filename].concat("/");
    };

    /**
     * Return the segments or a specific segment of the directory.
     * @param n int
     * @returns {*}
     */
    this.segments = function(n)
    {
        var arr = this.dir.split("/");
        if (!arguments.length) {
            return arr;
        }
        return arr[n] ? arr[n] : null;
    };

    /**
     * Add this file to a FileCollection.
     * @param collection FileCollection
     * @returns {File}
     */
    this.addTo = function(collection)
    {
        collection.push(this);
        return this;
    };

    /**
     * Clone this file object.
     * @returns {File}
     */
    this.clone = function()
    {
        return new File(this.path());
    };

    /**
     * Parse the given name into parts.
     * @param file string
     */
    function parse(file)
    {
        if (!file || file=="") {
            return;
        }
        var segments = file.split("/");
        var last = segments.pop();
        var parts = last.split(".");
        var dir = segments.join("/");
        var ext = parts.pop();

        self.filename = last;
        self.dir = dir=="" || !dir ? null : dir;
        self.extension = ext=="" || !ext ? null : ext;
        self.basename = parts.join(".");
    }
}

/**
 * Change the toString method to print the full filepath.
 * @returns {string}
 */
File.prototype.toString = function()
{
    return this.path();
};

/**
 * File Collection superArray of File objects.
 * @param files array of {File}
 * @constructor
 */
function FileCollection(files)
{
    var collection = this;

    this.buildFile = null;
    this.name = null;

    /**
     * Add files to this collection.
     * @param files string|array
     * @returns {FileCollection}
     */
    this.add = function(files)
    {
        if (!files) {
            return this;
        }
        if (files instanceof String || files instanceof File) {
            collection.push(files instanceof String ? new File(files) : files);
            return this;
        }
        files.map(function(file) {
            if (file instanceof File) {
                return collection.push(file);
            }
            return collection.push(new File(file));
        });
        return this;
    };

    /**
     * Return an array of the file paths.
     * @returns {*}
     */
    this.list = function()
    {
        return this.map(function(file) {
            return file.path();
        });
    };

    /**
     * Bulk-set the file directories.
     * @param dir string
     * @returns {FileCollection}
     */
    this.setDirectory = function(dir)
    {
        this.map(function(file){
            file.dir = dir;
        });
        return this;
    };

    this.setBuildFile = function(name, path)
    {
        this.buildFile = new File(name);
        if (path) this.buildFile.dir = path;
        return this;
    };

    /**
     * Clone this collection into a new collection.
     * @returns {FileCollection}
     */
    this.clone = function()
    {
        var files = this.map(function(file) {
            return file.clone();
        });
        return new FileCollection(files);
    };

    /**
     * Returns an object with the build file as the key
     * and the value as the array of files in this collection.
     * @param manipulator function - manipulates the build file name. optional
     * @returns {{}}
     */
    this.prefix = function(manipulator)
    {
        var out = {};
        out[this.buildFile.path(manipulator)] = this.list();
        return out;
    };

    /**
     * Return an object where the build file is the same file.
     * @param manipulator function - manipulates the build file name. optional
     * @returns {{}}
     */
    this.prefixOverwrite = function(manipulator)
    {
        var out = {};
        this.map(function(file) {
            out[file.path(manipulator)]  = file.path();
        });
        return out;
    };

    /**
     * Convert the collection to a handy object used by grunt.
     * @returns {{dest: string, src: []}}
     */
    this.toObject = function()
    {
        return {
            dest:this.buildFile.path(),
            src:this.list()
        }
    };


    this.add(files);
}

FileCollection.prototype = [];
FileCollection.prototype.constructor = FileCollection;



var builder = (function(){
    var grunt,
        options,
        groups = {};

    /**
     * Build configuration class.
     * @param group string
     * @constructor
     */
    function BuildConfiguration (group)
    {
        var tasks = [],
            collections = {},
            paths = {},
            build = this;

        // The name of this group.
        this.name = group;

        /**
         * Select or Create a new collection or add to existing collection.
         * @param name string
         * @param files string|array
         * @param opts
         * @returns {BuildConfiguration}
         */
        this.collection = function(name, files, opts)
        {
            // Requesting a collection.
            if (!files || !files.length) {
                return collections[name];
            }
            // Creating or modifying a collection.
            var object = collections[name] ? collections[name] : new FileCollection();
            object.add(files);

            // Applying options to a collection.
            if (opts) {
                if (opts.dir) object.setDirectory(replacePathKeys(opts.dir));
                if (opts.build) object.setBuildFile(replacePathKeys(opts.build));
            }
            object.name = name;
            collections[name] = object;
            return this;
        };

        /**
         * Get or set a common path.
         * @param name string
         * @param path string
         * @returns {*}
         */
        this.path = function(name, path)
        {
            if (!path) {
                return paths[name];
            }
            paths[name] = replacePathKeys(path);
            return this;
        };

        /**
         * Return the collections or a collection by name.
         * @param name string
         * @returns {FileCollection|null}
         */
        this.collections = function(name)
        {
            return name ? collections[name] : collections;
        };

        /**
         * Log to the console for debugging purposes.
         * @returns void
         */
        this.dump = function()
        {
            var i = 0;
            for (var name in collections) {
                var object = collections[name];
                console.log(chalk.green(object.name)+" -> "+chalk.red(object.buildFile));
                object.map(function(file) {
                    i++;
                    console.log(chalk.blue(i)+" "+file.path());
                });
                console.log("\n");
            }
        };

        /**
         * Return a collection of all the build files in this configuration.
         * @returns {FileCollection}
         */
        this.buildFiles = function()
        {
            var object = new FileCollection();
            for (var name in collections) {
                if (collections[name].buildFile) {
                    object.add(collections[name].buildFile.clone());
                }
            }
            return object;
        };

        /**
         * Check if a collection exists and has files.
         * @param key string
         * @returns {boolean}
         */
        this.has = function(key)
        {
            return collections[key] && collections[key].length>0 ? true:false;
        };

        /**
         * Add a task to the queue or display all tasks.
         * @param taskName string
         * @returns {BuildConfiguration|array}
         */
        this.tasks = function(taskName)
        {
            if (!arguments.length) {
                return tasks;
            }
            if (tasks.indexOf(taskName) === -1) {
                tasks.push(taskName);
            }
            return this;
        };

        /**
         * Replaces path keys with corresponding path.
         * @param string
         * @returns {string}
         */
        function replacePathKeys(string)
        {
            if (!string instanceof String) {
                return string;
            }
            for (var key in paths) {
                var string = string.replaceKey(key, paths[key]);
            }
            return string;
        }
    }

    /**
     * Parse the grunt flags into a nice object.
     * @param flags array
     * @returns {{}}
     */
    function parseFlags(flags)
    {
        var map = {};
        if (!flags.length) return map;

        flags.forEach(function(flag) {
            var parts = flag.replace("--","").split("=",2);
            map[parts[0]] = parts[1] ? parts[1] : true
        });
        return map;
    }

    return {
        /**
         * Set up the grunt instance and initial tasks.
         * @param instance grunt
         * @returns {BuildConfiguration|null}
         */
        init: function(instance)
        {
            grunt = instance;
            options = parseFlags(grunt.option.flags());

            // Node modules to load.
            grunt.loadNpmTasks('grunt-autoprefixer');
            grunt.loadNpmTasks('grunt-contrib-concat');
            grunt.loadNpmTasks('grunt-contrib-compass');
            grunt.loadNpmTasks('grunt-contrib-uglify');
            grunt.loadNpmTasks('grunt-contrib-cssmin');
            grunt.loadNpmTasks('grunt-contrib-watch');
            grunt.loadNpmTasks('grunt-react');

            var useGroup = options.use || 'default';
            var $ = this.use(useGroup);

            if (!$) {
                console.error(chalk.red("\nMissing Build Configuration! -> "+useGroup));
                process.exit();
            }

            console.log("\n"+"** Using Build Configuration: "+chalk.green($.name)+" **\n\n");

            return $;
        },

        /**
         * Fetch a build group.
         * @param group string
         * @returns {BuildConfiguration|null}
         */
        use: function(group)
        {
            return groups[group] ? groups[group] : null;
        },

        /**
         * Register a build group.
         * @param group string
         * @returns {BuildConfiguration}
         */
        register: function(group)
        {
            var configuration = new BuildConfiguration(group);
            return groups[group] = configuration;
        }
    }
})();

module.exports = builder;