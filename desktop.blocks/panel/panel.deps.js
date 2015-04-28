[{
    mustDeps : { block : 'i-bem', elems : 'dom' }
},
{
    shouldDeps : [
        { block : 'cookie' },
        { block : 'config' },
        { block : 'path' },
        { block : 'jquery' },
        { block : 'sort' },
        { block : 'state' },
        { block : 'list' },
        { block : 'functions', elems : 'debounce' },
        { block : 'path-normalizer' },
        { block : 'events', elems : 'channels' },
        { block : 'menu', mods : { theme : 'islands', mode : 'check' } }
    ]
},
{
    tech: 'js',
    mustDeps: { tech: 'bemhtml', block: 'menu' }
}]
