/**
 * This is a sample of how your build file can work.
 * @author Mike Adamczyk <mike@bom.us>
 */
var $ = require('./index');

/**
 * Bulk order configuration.
 */
$.register('bulkorder')
    .lib([
        'lib/jquery/dist/jquery.min.js',
        'lib/react/react.js',
        'lib/react/react-dom.js'
    ])
    .src([
        'main.js'
    ])
    .srcJsx([
        'bulkorder.jsx'
    ]);


/**
 * Default configuration.
 */
$.register('site')
    .css([
        "base.css",
        "site.css"
    ])
    .lib([
        "lib/modernizr/modernizr.js",
        "lib/jquery/dist/jquery.min.js",
        "lib/jquery.cookie/jquery.cookie.js",
        "lib/fastclick/lib/fastclick.js",
        "lib/foundation/js/foundation.min.js",
        "lib/angular/angular.min.js",
        "lib/angular-sanitize/angular-sanitize.min.js",
        "lib/scrollmagic/scrollmagic/minified/ScrollMagic.min.js",
        "lib/d3/d3.min.js",
        "lib/d3/sankey.lib.js",
        "lib/d3-tip/index.js",
        "lib/topojson/topojson.js",
        "lib/handlebars/handlebars.min.js",
        "lib/gsap/src/minified/TweenMax.min.js",
        "lib/gsap/src/minified/plugins/ScrollToPlugin.min.js"
    ])
    .src([
        "vis/util.js",
        "vis/main.js",
        "vis/event.js",
        "vis/animate.js",
        "vis/draw/draw-utils.js",
        "vis/draw/line.js",
        "vis/draw/sankey.js",
        "vis/draw/scatter.js",
        "vis/draw/bubble.js",
        "vis/draw/choropleth.js",
        "vis/draw/bar.js",
        "vis/base.js",
        "vis/layer.js",
        "vis/axis.js",
        "vis/tip.js",
        "vis/series/series.js",
        "vis/series/basic.js",
        "vis/series/sankey.js",
        "vis/chart/chart.js",
        "vis/chart/basic.js",
        "vis/chart/sankey.js",
        "vis/chart/choropleth.js"
    ]);

module.exports = $;