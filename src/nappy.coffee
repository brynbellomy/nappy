#
# # nappy
#
# node.js api querying from the terminal  
# bryn austin bellomy (bryn.bellomy@gmail.com)
#


JSONStream = require 'JSONStream'
request    = require 'request'
mkdirp     = require 'mkdirp'
path       = require 'path'
clc        = require 'cli-color'
fs         = require 'fs'
es         = require 'event-stream'
$f         = require 'filed'
$          = require 'jquery'

colors =
  header:     clc.white.bold.underline
  footer:     clc.white.bold
  text:       clc.xterm(75)
  code:       clc.xterm(195).bold
  code_block: clc.xterm(255).bgXterm(235) #.bold
  err:        clc.red


argv = require('optimist')
         .alias('c', 'coffee').describe('c', 'Output code blocks as coffeescript.').default('c', false).boolean('c')
         .alias('w', 'wipe-cache').describe('w', 'Wipe the locally-cached version of the API docs and re-download.').default('w', false).boolean('w')
         .alias('d', 'debug').describe('d', 'Display debug output.').default('d', false).boolean('d')
         .usage('Usage:\n   $ nappy [options] <command> <thing to lookup>\n\nExample:\n   $ nappy -cw func fs.readFile\n\nCommands:\n   function (aliases: f, func, m, method)\n   class    (aliases: c)\n   ls       (aliases: l, list)')
         .demand(2).argv


#
# usage examples:
#
# - nappy f  fs.readFile
# - nappy c  child_process.ChildProcess
# - nappy ls stream
# - nappy ls stream.classes
#

cmd = argv._[0]
[the_module, the_thing_in_the_module] = argv._[1].toString().split '.'

switch cmd
  when 'f', 'func', 'function', 'm', 'method'
    cmd = 'function'
    parser = JSONStream.parse ['modules', true, 'methods', true]

  when 'c', 'class'
    cmd = 'class'
    parser = JSONStream.parse ['modules', true, 'classes', true]

  when 'l', 'ls', 'list'
    cmd = 'list'

    switch the_thing_in_the_module
      when 'c', 'class', 'classes'
        parser = JSONStream.parse ['modules', true, 'classes', true]
      when 'f', 'func', 'funcs', 'function', 'functions', 'm', 'method', 'methods'
        parser = JSONStream.parse ['modules', true, 'methods', true]
      else
        parser = JSONStream.parse ['modules', true, true, true]

  else
    console.error 'Couldn\'t figure out the arguments you gave.  Try running "nappy --help".'
    process.exit(1)
    



filter = es.through (obj) ->
  if not obj?.desc? or not obj?.name? then return

  if obj.name is the_thing_in_the_module
    # spit out the thing's title
    if obj.textRaw?
      console.log colors.header(obj.textRaw)

    @emit 'data', obj



jquery_tree = es.through (jsonObject) ->

  jquery_tree_recurse = (args) =>
    {tagType, contents, jsonObject, code_block} = args
    tagType = tagType?.toLowerCase?()

    code_block = (tagType is 'pre' or code_block is yes)

    for node in contents
      switch node.nodeType
        # plain, unwrapped text
        when 3
          @emit 'data', tagType: tagType, jsonObject: jsonObject, node: node, text: $(node).text().toString(), code_block: code_block
        # an element
        when 1
          jquery_tree_recurse(tagType: node.tagName, jsonObject: jsonObject, contents: $(node).contents().toArray(), code_block: code_block)

  # --- end jquery_tree_recurse --- #
  
  $contents = $(jsonObject.desc)
  jquery_tree_recurse {tagType: null, jsonObject: jsonObject, contents: $contents, code_block: no}



whitespace_filter = es.through (args) ->
  {tagType, node, jsonObject, text, code_block} = args  

  if code_block is no
    # condense any multiple newlines into a single newline
    args.text = text.replace /\n+/g, '\n'
  else
    # ensure that code blocks end with only one blank line
    args.text = text.replace(/\s+$/g, '').replace(/[ \t]*\n/g, '\n')
    args.text += '\n'

  @emit 'data', args



coffee_maker = es.through (args) ->
  {tagType, node, jsonObject, text, code_block} = args

  if code_block is yes and tagType?.toLowerCase?() is 'code' and argv.coffee is yes
    js2coffee = require 'js2coffee'
    try
      text = js2coffee.build text
    catch exception
      if argv.debug is yes
        console.log colors.err('[js2coffee] Exception:'), exception
        console.log colors.err('[js2coffee] Failed while converting code:'), text

  @emit 'data', { tagType: tagType, jsonObject: jsonObject, node: node, text: text, code_block: code_block }



colorizer = es.through (args) ->
  {tagType, node, jsonObject, text, code_block} = args

  if tagType is 'code' and code_block is yes
    code = text
            .split('\n')
            .map((line) -> return line.replace /\s*$/, '')

    longest_line = 0
    longest_line = line.length for line in code when line.length > longest_line

    padding_left = 2
    padding_right = 2

    code.unshift ''
    matted = []
    for line in code
      num_spaces_on_left  = padding_left
      num_spaces_on_right = longest_line - line.length + padding_right
      spaces_on_left  = Array(num_spaces_on_left  + 1).join(' ')
      spaces_on_right = Array(num_spaces_on_right + 1).join(' ')

      matted.push colors.code_block("#{spaces_on_left}#{line}#{spaces_on_right}")

      data = matted.join('\n') + '\n'

  else if tagType is 'code' and code_block is no
    data = colors.code(text)
  else
    data = colors.text(text)

  @emit 'data', data
  



obtain_data = () ->
  cache_file = path.join(process.env.HOME, '.nodejs-docs-cache', "#{the_module}.json")

  if argv['wipe-cache'] is yes or not fs.existsSync(cache_file)
    console.log 'Cache is being re-filled.\n'

    mkdirp.sync path.join(process.env.HOME, '.nodejs-docs-cache')
    docs_url = "http://nodejs.org/api/#{the_module}.json"
    data_stream = request(docs_url)
    data_stream.pipe $f(cache_file)

  else
    console.log 'Using cached docs.\n'
    data_stream = $f(cache_file)

    # for some reason, the `filed` module's `pipe` function doesn't return the pipe's
    # destination like most pipe functions.  so we'll just fix that...
    old_pipe_fn = data_stream.pipe
    data_stream.pipe = (into) ->
      old_pipe_fn.call(data_stream, into)
      return into
  
  if cmd is 'list'
    header_str = the_module + (if the_thing_in_the_module? then " -> #{the_thing_in_the_module}" else '')
    console.log colors.header(header_str)

  return data_stream



summarizer = es.through (obj) ->
  if obj?.textRaw?
    @emit 'data', "#{obj.textRaw}\n"
  else
    @emit 'data', "#{obj.name}\n"




process.stdout.write '\n'

switch cmd
  when 'function', 'class'
    obtain_data()
      .pipe(parser)
      .pipe(filter)
      .pipe(jquery_tree)
      .pipe(whitespace_filter)
      .pipe(coffee_maker)
      .pipe(colorizer)
      .pipe(process.stdout)

  when 'list'
    obtain_data()
      .pipe(parser)
      .pipe(summarizer)
      .pipe(process.stdout)

process.on 'exit', ->
  process.stdout.write colors.footer(Array(50).join('_')) + '\n'





