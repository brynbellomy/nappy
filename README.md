# // nappy

`nappy` queries the latest **node.js api** docs from the **command line**.



# basic usage

```sh
$ nappy fs.readFile
```



# command-line options

```
Usage:
   $ nappy [options] <command> <thing to lookup>

Options:
  -c, --coffee      Output code blocks as coffeescript.                               [boolean]  [default: false]
  -w, --wipe-cache  Wipe the locally-cached version of the API docs and re-download.  [boolean]  [default: false]
  -d, --debug       Display debug output.                                             [boolean]  [default: false]
```



# commands


### function (aliases: `f`, `func`, `m`, `method`)

displays documentation for a single function.

ex: `$ nappy f fs.readFile`

<img src="http://f.cl.ly/items/2f3q1y3K34273r1h242D/nappy-screenshot-func.png" />


### class (aliases: `c`)

displays documentation for a class.

ex: `$ nappy c child_process.ChildProcess`

<img src="http://f.cl.ly/items/1L2D0c0n1k0Z3y3U252T/nappy-screenshot-class.png" />


### ls (aliases: `l`, `list`)

lists the functions and classes exported by a module.

ex: `$ nappy ls util`

<img src="http://f.cl.ly/items/0c3O0Z2L1O1M372g3P1X/nappy-screenshot-ls.png" />



# how to specify the 'thing to lookup'

for the `ls` command, simply specify the module name you'd like to see the contents of.

for `function` and `class`, you must specify `<module>.<thing>` (i.e. `fs.readFile`, etc.)



# nappy caches the api docs for offline viewing

good for coding on airplanes if you don't have $5 to blow on airtran wi-fi.  if you need to clear the cache, just pass the `-w` flag.  but don't do it while you're offline or you'll bust the cache and refill it with _**a vast nothingness**_.

```sh
nappy -w util.inspect
```



# @todo

- customizable color schemes



# authors / contributors

bryn austin bellomy < <bryn.bellomy@gmail.com> >



# license (wtfpl v2)

```
DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
Version 2, December 2004

Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>

Everyone is permitted to copy and distribute verbatim or modified 
copies of this license document, and changing it is allowed as long 
as the name is changed. 

DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

0. You just DO WHAT THE FUCK YOU WANT TO. 
```
