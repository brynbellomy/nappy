# // nappy

`nappy` queries the latest **node.js api** docs from the **command line**.


## basic usage

```sh
nappy -c fs.readFile
```

## nappy caches the api docs for offline viewing

if you need to clear the cache, just pass the `-w` flag.

```sh
nappy -w -c util.inspect
```

## @todo

- custom color schemes
- querying for things other than module functions


