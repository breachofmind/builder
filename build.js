/**
 * This is a sample of how your build file can work.
 * @author Mike Adamczyk <mike@bom.us>
 */
var $ = require('./index');

var build = $.register('default')
    .path('asset', 'resources/assets')
    .path('scss', '{asset}/scss')
    .path('js', '{asset}/js')
    .path('static', 'public/static')

    // Javascript libraries.
    .collection('js-lib', [
        "modernizr.js",
        "jquery/dist/jquery.min.js",
        "jquery.cookie/jquery.cookie.js",
        "fastclick/lib/fastclick.js",
        "foundation/js/foundation.min.js",
        "angular/angular.min.js",
        "angular-sanitize/angular-sanitize.min.js",
        "scrollmagic/scrollmagic/minified/ScrollMagic.min.js",
        "d3/d3.min.js",
        "d3/sankey.lib.js",
        "d3-tip/index.js",
        "topojson/topojson.js",
        "handlebars/handlebars.min.js",
        "gsap/src/minified/TweenMax.min.js",
        "gsap/src/minified/plugins/ScrollToPlugin.min.js"
    ], {
        dir: '{js}/lib',
        build: '{static}/default.lib.js'
    })
    // Javascript source code.
    .collection('js-src', [
        "util.js",
        "main.js",
        "event.js",
        "animate.js",
        "draw/draw-utils.js",
        "draw/line.js",
        "draw/sankey.js",
        "draw/scatter.js",
        "draw/bubble.js",
        "draw/choropleth.js",
        "draw/bar.js",
        "base.js",
        "layer.js",
        "axis.js",
        "tip.js",
        "series/series.js",
        "series/basic.js",
        "series/sankey.js",
        "chart/chart.js",
        "chart/basic.js",
        "chart/sankey.js",
        "chart/choropleth.js"
    ], {
        dir: '{asset}/js/vis',
        build: '{static}/default.src.js'
    })
    // Generated css for autoprefix.
    .collection('css', [
        "base.css",
        "site.css"
    ], {
        dir: '{static}'
    });

build.dump();

module.exports = $;