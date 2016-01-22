var inspect = require('util').inspect,
    defaults = {};

defaults.buildPath = "public/static";
defaults.resourcePath = "resources";
defaults.assetPath = "resources/assets";


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
     * @param n
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

    /**
     * Add files to this collection.
     * @param files
     * @returns {FileCollection}
     */
    this.add = function(files)
    {
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
        var conf = {},
            tasks = [],
            build = this;

        // The name of this group.
        this.name = group;

        // Default paths.
        var paths = {
            build:      "public/static",
            resource:   "resources",
            asset:      "resources/assets",
            view:       "resources/views",
            js:         "resources/assets/js",
            scss:       "resources/assets/scss",
            jsx:        "resources/assets/jsx",
            import:     null,
        };

        for (var prop in paths) {
            this[prop] = getPath(prop);
        }

        // File names to build the conf files into.
        // These files are dumped into the build directory.
        var buildTo = {
            src:    this.name+".src.js",
            lib:    this.name+".lib.js",
            jsx:    this.name+".jsx.js"
        };

        /**
         * Bulk-set the file and build paths.
         * @param func function
         * @returns {BuildConfiguration}
         */
        this.setPaths = function(func)
        {
            func(paths,buildTo,this);
            for (var prop in paths) {
                this[prop] = getPath(prop);
            }
            return this;
        };

        /**
         * Return the full build path to the given key.
         * Or, set the buildTo key or inspect the buildTo object.
         * @param key string
         * @param file string|function(BuildConfiguration)
         * @returns {string|BuildConfiguration|object}
         */
        this.to = function(key,file)
        {
            if (!arguments.length) {
                return buildTo;
            }
            if (file) {
                buildTo[key] = typeof file==="function" ? file(this) : file;
                return this;
            }
            return this.build(buildTo[key]);
        };

        /**
         * Return a prefixed build path for when overwriting a file.
         * @param key string
         * @returns {object}
         */
        this.prefixTo = function(key)
        {
            var out = {};
            out[this.to(key)] = this.to(key);
            return out;
        };

        /**
         * Return an object where the key is the build path and the value is the array of files.
         * @param key string
         * @returns {{}}
         */
        this.into = function(key)
        {
            var out = {};
            out[this.to(key)] = this.config(key);
            return out;
        };

        /**
         * For each file in the given config key, return object with key prefixed with file path.
         * @param key string
         * @returns {{}}
         */
        this.prefix = function(key)
        {
            var out = {};
            var files = this.config(key);
            if (files && files.length) {
                files.map(function(file) {
                    out[file] = file;
                });
            }
            return out;
        };

        /**
         * Create a path or array of paths from a file or set of files.
         * @param pathName string
         * @param prefix string
         * @param files string|array
         * @returns {*}
         */
        this.path = function(pathName,prefix,files)
        {
            // No arguments, return all paths.
            if (!arguments.length) {
                return paths;
            }
            var path = paths[pathName];

            // No file
            if (!files) {
                return path;
            }

            // Multiple Files
            if (typeof files=="object") {
                return files.map(function(file,i) {
                    if (join(prefix,file).indexOf(path) ==0) return file;
                    return join(path,prefix,file);
                });
            }

            // Single file
            if (join(prefix,files).indexOf(path) ==0) return files;
            return join(path,prefix,files);
        };

        /**
         * Create a new path type.
         * @param pathName string
         * @param path string
         * @returns {BuildConfiguration}
         */
        this.setPath = function(pathName, path)
        {
            paths[pathName] = path;
            this[pathName] = getPath(pathName);
            return this;
        };

        /**
         * Add files to the build configuration.
         * @param type string property in config
         * @param pathName string
         * @param files string|array
         * @returns {BuildConfiguration}
         */
        this.add = function(type,pathName,files)
        {
            if (!conf[type]) {
                conf[type] = [];
            }
            if (typeof files=="function") {
                conf[type].merge( files(this,this[pathName]) );
                return this;
            }
            conf[type].merge( this[pathName](files) );
            return this;
        };

        // Alias methods to add stuff to the config.
        this.src    = confOp('src','js');
        this.lib    = confOp('lib','js');
        this.css    = confOp('css','build');
        this.srcJsx = confOp('jsx','jsx');

        /**
         * Set the config or get the config, or a property of the config.
         * @param key string
         * @returns {object|array|null}
         */
        this.config = function(key,value)
        {
            if (!arguments.length) {
                return conf;
            }
            if (key && !value) {
                return conf[key] || null;
            }
            conf[key] = value;
            return this;
        };

        /**
         * Check if a key is set and has any items.
         * @param key
         * @returns {boolean}
         */
        this.has = function(key)
        {
            return conf[key] && conf[key].length>0 ? true:false;
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
         * Set up an alias for adding files to the config.
         * @param type
         * @param pathName
         * @returns {Function}
         */
        function confOp(type,pathName)
        {
            return function(files)
            {
                if (!arguments.length) {
                    return build.config(type);
                }
                return build.add(type,pathName,files);
            }
        }

        /**
         * Set up an alias for creating a path to a file or files.
         * @param pathName string
         * @returns {Function}
         */
        function getPath(pathName)
        {
            return function()
            {
                var args = getPathArguments(arguments, pathName);
                return build.path(args.path, args.prefix, args.files);
            }
        }

        /**
         * Determine the arguments passed to this.path()
         * @param arr object
         * @param pathName string
         * @returns {{path: *, prefix: null, files: null}}
         */
        function getPathArguments(arr,pathName)
        {
            var args = {
                path:pathName,
                prefix:null,
                files:null,
            };
            switch (arr.length) {
                case 0:
                    return args;
                case 1:
                    args.files = arr[0];
                    return args;
                case 2:
                    args.files = arr[1];
                    args.prefix = arr[0];
                    return args;
                default:
                    throw ("Too Many arguments supplied for getPathArguments.");
                    break;
            }
        }

        /**
         * Join all arguments passed to this function and ignore empty ones.
         * @returns {string}
         */
        function join()
        {
            var str = [];
            for (var i in arguments)
            {
                if (!arguments[i]) continue;
                str.push(arguments[i]);
            }
            return str.join("/");
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

            return this.use( options.use || 'default' );
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