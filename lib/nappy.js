(function() {
  var $, $f, JSONStream, argv, clc, cmd, coffee_maker, colorizer, colors, es, filter, fs, jquery_tree, mkdirp, obtain_data, parser, path, request, summarizer, the_module, the_thing_in_the_module, whitespace_filter, _ref;

  JSONStream = require('JSONStream');

  request = require('request');

  mkdirp = require('mkdirp');

  path = require('path');

  clc = require('cli-color');

  fs = require('fs');

  es = require('event-stream');

  $f = require('filed');

  $ = require('jquery');

  colors = {
    header: clc.white.bold.underline,
    footer: clc.white.bold,
    text: clc.xterm(75),
    code: clc.xterm(195).bold,
    code_block: clc.xterm(255).bgXterm(235),
    err: clc.red
  };

  argv = require('optimist').alias('c', 'coffee').describe('c', 'Output code blocks as coffeescript.')["default"]('c', false).boolean('c').alias('w', 'wipe-cache').describe('w', 'Wipe the locally-cached version of the API docs and re-download.')["default"]('w', false).boolean('w').alias('d', 'debug').describe('d', 'Display debug output.')["default"]('d', false).boolean('d').demand(2).argv;

  cmd = argv._[0];

  _ref = argv._[1].toString().split('.'), the_module = _ref[0], the_thing_in_the_module = _ref[1];

  switch (cmd) {
    case 'f':
    case 'func':
    case 'function':
    case 'm':
    case 'method':
      cmd = 'function';
      parser = JSONStream.parse(['modules', true, 'methods', true]);
      break;
    case 'c':
    case 'class':
      cmd = 'class';
      parser = JSONStream.parse(['modules', true, 'classes', true]);
      break;
    case 'l':
    case 'ls':
    case 'list':
      cmd = 'list';
      switch (the_thing_in_the_module) {
        case 'c':
        case 'class':
        case 'classes':
          parser = JSONStream.parse(['modules', true, 'classes', true]);
          break;
        case 'f':
        case 'func':
        case 'funcs':
        case 'function':
        case 'functions':
        case 'm':
        case 'method':
        case 'methods':
          parser = JSONStream.parse(['modules', true, 'methods', true]);
          break;
        default:
          parser = JSONStream.parse(['modules', true, true, true]);
      }
      break;
    default:
      console.error('Couldn\'t figure out the arguments you gave.  Try running "nappy --help".');
      process.exit(1);
  }

  filter = es.through(function(obj) {
    if (!((obj != null ? obj.desc : void 0) != null) || !((obj != null ? obj.name : void 0) != null)) {
      return;
    }
    if (obj.name === the_thing_in_the_module) {
      if (obj.textRaw != null) {
        console.log(colors.header(obj.textRaw));
      }
      return this.emit('data', obj);
    }
  });

  jquery_tree = es.through(function(jsonObject) {
    var $contents, jquery_tree_recurse,
      _this = this;
    jquery_tree_recurse = function(args) {
      var code_block, contents, node, tagType, _i, _len, _results;
      tagType = args.tagType, contents = args.contents, jsonObject = args.jsonObject, code_block = args.code_block;
      tagType = tagType != null ? typeof tagType.toLowerCase === "function" ? tagType.toLowerCase() : void 0 : void 0;
      code_block = tagType === 'pre' || code_block === true;
      _results = [];
      for (_i = 0, _len = contents.length; _i < _len; _i++) {
        node = contents[_i];
        switch (node.nodeType) {
          case 3:
            _results.push(_this.emit('data', {
              tagType: tagType,
              jsonObject: jsonObject,
              node: node,
              text: $(node).text().toString(),
              code_block: code_block
            }));
            break;
          case 1:
            _results.push(jquery_tree_recurse({
              tagType: node.tagName,
              jsonObject: jsonObject,
              contents: $(node).contents().toArray(),
              code_block: code_block
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
      contents: $contents,
      code_block: false
    });
  });

  whitespace_filter = es.through(function(args) {
    var code_block, jsonObject, node, tagType, text;
    tagType = args.tagType, node = args.node, jsonObject = args.jsonObject, text = args.text, code_block = args.code_block;
    if (code_block === false) {
      args.text = text.replace(/\n+/g, '\n');
    } else {
      args.text = text.replace(/\s+$/g, '').replace(/[ \t]*\n/g, '\n');
      args.text += '\n';
    }
    return this.emit('data', args);
  });

  coffee_maker = es.through(function(args) {
    var code_block, js2coffee, jsonObject, node, tagType, text;
    tagType = args.tagType, node = args.node, jsonObject = args.jsonObject, text = args.text, code_block = args.code_block;
    if (code_block === true && (tagType != null ? typeof tagType.toLowerCase === "function" ? tagType.toLowerCase() : void 0 : void 0) === 'code' && argv.coffee === true) {
      js2coffee = require('js2coffee');
      try {
        text = js2coffee.build(text);
      } catch (exception) {
        if (argv.debug === true) {
          console.log(colors.err('[js2coffee] Exception:'), exception);
          console.log(colors.err('[js2coffee] Failed while converting code:'), text);
        }
      }
    }
    return this.emit('data', {
      tagType: tagType,
      jsonObject: jsonObject,
      node: node,
      text: text,
      code_block: code_block
    });
  });

  colorizer = es.through(function(args) {
    var code, code_block, data, jsonObject, line, longest_line, matted, node, num_spaces_on_left, num_spaces_on_right, padding_left, padding_right, spaces_on_left, spaces_on_right, tagType, text, _i, _j, _len, _len1;
    tagType = args.tagType, node = args.node, jsonObject = args.jsonObject, text = args.text, code_block = args.code_block;
    if (tagType === 'code' && code_block === true) {
      code = text.split('\n').map(function(line) {
        return line.replace(/\s*$/, '');
      });
      longest_line = 0;
      for (_i = 0, _len = code.length; _i < _len; _i++) {
        line = code[_i];
        if (line.length > longest_line) {
          longest_line = line.length;
        }
      }
      padding_left = 2;
      padding_right = 2;
      code.unshift('');
      matted = [];
      for (_j = 0, _len1 = code.length; _j < _len1; _j++) {
        line = code[_j];
        num_spaces_on_left = padding_left;
        num_spaces_on_right = longest_line - line.length + padding_right;
        spaces_on_left = Array(num_spaces_on_left + 1).join(' ');
        spaces_on_right = Array(num_spaces_on_right + 1).join(' ');
        matted.push(colors.code_block("" + spaces_on_left + line + spaces_on_right));
        data = matted.join('\n') + '\n';
      }
    } else if (tagType === 'code' && code_block === false) {
      data = colors.code(text);
    } else {
      data = colors.text(text);
    }
    return this.emit('data', data);
  });

  obtain_data = function() {
    var cache_file, data_stream, docs_url, header_str, old_pipe_fn;
    cache_file = path.join(process.env.HOME, '.nodejs-docs-cache', "" + the_module + ".json");
    if (argv['wipe-cache'] === true || !fs.existsSync(cache_file)) {
      console.log('Cache is being re-filled.\n');
      mkdirp.sync(path.join(process.env.HOME, '.nodejs-docs-cache'));
      docs_url = "http://nodejs.org/api/" + the_module + ".json";
      data_stream = request(docs_url);
      data_stream.pipe($f(cache_file));
    } else {
      console.log('Using cached docs.\n');
      data_stream = $f(cache_file);
      old_pipe_fn = data_stream.pipe;
      data_stream.pipe = function(into) {
        old_pipe_fn.call(data_stream, into);
        return into;
      };
    }
    if (cmd === 'list') {
      header_str = the_module + (the_thing_in_the_module != null ? " -> " + the_thing_in_the_module : '');
      console.log(colors.header(header_str));
    }
    return data_stream;
  };

  summarizer = es.through(function(obj) {
    if ((obj != null ? obj.textRaw : void 0) != null) {
      return this.emit('data', "" + obj.textRaw + "\n");
    } else {
      return this.emit('data', "" + obj.name + "\n");
    }
  });

  process.stdout.write('\n');

  switch (cmd) {
    case 'function':
    case 'class':
      obtain_data().pipe(parser).pipe(filter).pipe(jquery_tree).pipe(whitespace_filter).pipe(coffee_maker).pipe(colorizer).pipe(process.stdout);
      break;
    case 'list':
      obtain_data().pipe(parser).pipe(summarizer).pipe(process.stdout);
  }

  process.on('exit', function() {
    return process.stdout.write(colors.footer(Array(50).join('_')) + '\n');
  });

}).call(this);