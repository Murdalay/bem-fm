[{
    mustDeps : { block : 'i-bem', elems : 'dom' }
},
{
    shouldDeps : [
        { block : 'path' },
        { block : 'jquery' },
        { block : 'sort' },
        { block : 'state' },
        { block : 'list' },
        { block : 'functions', elems : 'debounce' },
        { block : 'path-normalizer' },
        { block : 'events', elems : 'channels' },
        { block : 'select', mods : { mode : 'radio', theme : 'islands'} },
        { block : 'menu', mods : { panel : true, mode : 'check' } },
        { block : 'menu-tems', mods : { pathfinder : true } }
    ]
},
{
    tech: 'js',
    mustDeps: [
        { tech: 'bemhtml', block : 'select', mods : { mode : 'radio', theme : 'islands', size : 'l' } },
        { tech: 'bemhtml', block: 'menu', mods : { panel: true, theme : 'islands', size : 'l', mode : 'check' } }
    ]
}]
