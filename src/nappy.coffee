# nappy
# node.js api querying from the terminal
# bryn austin bellomy (bryn.bellomy@gmail.com)
#
# @@TODO:
# - remove excess whitespace: something like - chunk.split("\n").filter((part) -> if part.trim().length <= 0 return false else return true).join('\n')
# - make it possible to query other types of things (like 'readable stream')


JSONStream = require 'JSONStream'
request    = require 'request'
fs         = require 'fs'
es         = require 'event-stream'
$f         = require 'filed'
$          = require 'jquery'
require "colors"

argv = require('optimist')
         .alias('c', 'coffee').describe('c', 'Output code blocks as coffeescript.').default('c', false).boolean('c')
         .alias('w', 'wipe-cache').describe('w', 'Wipe the locally-cached version of the API docs and re-download.').default('w', false).boolean('w')
         .demand(1).argv

[ the_module, the_fn ] = argv._[0].toString().split '.'

docs_url = "http://nodejs.org/api/#{the_module}.json"


parser = JSONStream.parse [ 'modules', true, 'methods', true ]



filter = es.through (obj) ->
  if not obj?.desc? or not obj?.name? then return

  if obj.name is the_fn
    if obj.textRaw?
      console.log "===== #{obj.textRaw}".yellow.bold, "\n"
    @emit 'data', obj



jquery_tree = es.through (jsonObject) ->
  jquery_tree_recurse = (args) =>
    {tagType, contents, jsonObject} = args

    for node in contents
      switch node.nodeType
        # plain, unwrapped text
        when 3 then @emit 'data', { tagType: tagType?.toLowerCase?(), jsonObject: jsonObject, node: node, text: $(node).text().toString() }
        # an element
        when 1 then jquery_tree_recurse { tagType: node.tagName, jsonObject: jsonObject, contents: $(node).contents().toArray() }
  # end jquery_tree_recurse
  
  $contents = $(jsonObject.desc)
  jquery_tree_recurse { tagType: null, jsonObject: jsonObject, contents: $contents }



coffee_maker = es.through (args) ->
  {tagType, node, jsonObject, text} = args

  if tagType?.toLowerCase?() is 'code' and argv.coffee is yes
    js2coffee = require 'js2coffee'
    try
      text = js2coffee.build text
    catch exception
      console.log 'exception: ', exception
      console.log 'failtext:', text

  @emit 'data', { tagType: tagType, jsonObject: jsonObject, node: node, text: text }


colorizer = es.through (args) ->
  {tagType, node, jsonObject, text} = args

  data = (if tagType is 'code' then text.white.bold else text.magenta)
  @emit 'data', data
  

cache_file = "#{process.env.HOME}/.nodejs-docs-cache.json"

if argv['wipe-cache'] is yes or not fs.existsSync cache_file
  obtain_data = () ->
    # console.log "Cache is being re-filled."
    req = request docs_url
    req.pipe $f(cache_file)
    return req
else
  obtain_data = () ->
    # console.log "Using cached docs."
    $f cache_file



console.log ""
obtain_data()
  .pipe(parser)
parser
  .pipe(filter)
  .pipe(jquery_tree)
  .pipe(coffee_maker)
  .pipe(colorizer)
  .pipe(process.stdout)

process.on "exit", ->
  console.log "\n===============================================\n".yellow.bold





