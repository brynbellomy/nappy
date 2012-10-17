(function() {
  var $, $f, JSONStream, argv, cache_file, coffee_maker, colorizer, docs_url, es, filter, fs, jquery_tree, obtain_data, parser, request, the_fn, the_module, _ref;

  request = require('request');

  fs = require('fs');

  es = require('event-stream');

  JSONStream = require('JSONStream');

  $f = require('filed');

  $ = require('jquery');

  require("colors");

  argv = require('optimist').alias('c', 'coffee').describe('c', 'Output code blocks as coffeescript.')["default"]('c', false).alias('w', 'wipe-cache').describe('w', 'Wipe the locally-cached version of the API docs and re-download.')["default"]('w', false).demand(1).argv;

  _ref = argv._[0].toString().split('.'), the_module = _ref[0], the_fn = _ref[1];

  docs_url = "http://nodejs.org/api/" + the_module + ".json";

  parser = JSONStream.parse(['modules', true, 'methods', true]);

  filter = es.through(function(obj) {
    if (!((obj != null ? obj.desc : void 0) != null) || !((obj != null ? obj.name : void 0) != null)) {
      return;
    }
    if (obj.name === the_fn) {
      if (obj.textRaw != null) {
        console.log(("===== " + obj.textRaw).yellow.bold, "\n");
      }
      return this.emit('data', obj);
    }
  });

  jquery_tree = es.through(function(jsonObject) {
    var $contents, jquery_tree_recurse,
      _this = this;
    jquery_tree_recurse = function(args) {
      var contents, node, tagType, _i, _len, _results;
      tagType = args.tagType, contents = args.contents, jsonObject = args.jsonObject;
      _results = [];
      for (_i = 0, _len = contents.length; _i < _len; _i++) {
        node = contents[_i];
        switch (node.nodeType) {
          case 3:
            _results.push(_this.emit('data', {
              tagType: tagType != null ? typeof tagType.toLowerCase === "function" ? tagType.toLowerCase() : void 0 : void 0,
              jsonObject: jsonObject,
              node: node,
              text: $(node).text().toString()
            }));
            break;
          case 1:
            _results.push(jquery_tree_recurse({
              tagType: node.tagName,
              jsonObject: jsonObject,
              contents: $(node).contents().toArray()
            }));
            break;
          default:
            _results.push(void 0);
        }
      }
      return _results;
    };
    $contents = $(jsonObject.desc);
    return jquery_tree_recurse({
      tagType: null,
      jsonObject: jsonObject,
      contents: $contents
    });
  });

  coffee_maker = es.through(function(args) {
    var js2coffee, jsonObject, node, tagType, text;
    tagType = args.tagType, node = args.node, jsonObject = args.jsonObject, text = args.text;
    if ((tagType != null ? typeof tagType.toLowerCase === "function" ? tagType.toLowerCase() : void 0 : void 0) === 'code' && argv.coffee === true) {
      js2coffee = require("js2coffee");
      try {
        text = js2coffee.build(text);
      } catch (exception) {
        console.log("exception: ", exception);
        console.log("failtext:", text);
      }
    }
    return this.emit('data', {
      tagType: tagType,
      jsonObject: jsonObject,
      node: node,
      text: text
    });
  });

  colorizer = es.through(function(args) {
    var data, jsonObject, node, tagType, text;
    tagType = args.tagType, node = args.node, jsonObject = args.jsonObject, text = args.text;
    data = (tagType === 'code' ? text.white.bold : text.magenta);
    return this.emit('data', data);
  });

  cache_file = "" + process.env.HOME + "/.nodejs-docs-cache.json";

  if (argv['wipe-cache'] === true || !fs.existsSync(cache_file)) {
    obtain_data = function() {
      var req;
      req = request(docs_url);
      req.pipe($f(cache_file));
      return req;
    };
  } else {
    obtain_data = function() {
      return $f(cache_file);
    };
  }

  console.log("");

  obtain_data().pipe(parser);

  parser.pipe(filter).pipe(jquery_tree).pipe(coffee_maker).pipe(colorizer).pipe(process.stdout);

  process.on("exit", function() {
    return console.log("\n===============================================\n".yellow.bold);
  });

}).call(this);