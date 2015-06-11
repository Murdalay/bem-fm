({
    block: 'page',
    title: 'BEM-File manager',
    styles: [
        { elem: 'css', url: '_index.css' }
    ],
    scripts: [
        { elem: 'js', url: '_index.js' },
    ],
    content: [
    {
        block: 'manager',
        content: [
            {
                block : 'control-group',
                content : [
                    {
                        block : 'button',
                        mods : { theme : 'islands', size : 'xl', action: 'true' },
                        name : 'new',
                        text : 'New'
                    },
                    {
                        block : 'button',
                        mods : { theme : 'islands', size : 'xl', action: 'true' },
                        name : 'mkdir',
                        text : 'Create Folder'
                    },
                    {
                        block : 'button',
                        mods : { theme : 'islands', size : 'xl', action: 'true' },
                        name : 'hardlink',
                        text : 'Hardlink'
                    },
                    {
                        block : 'button',
                        mods : { theme : 'islands', size : 'xl', action: 'true' },
                        name : 'symlink',
                        text : 'SymLink'
                    },
                    {
                        block : 'button',
                        mods : { theme : 'islands', size : 'xl', action: 'true' },
                        name : 'copy',
                        text : 'Copy'
                    },
                    {
                        block : 'button',
                        mods : { theme : 'islands', size : 'xl', action: 'true' },
                        name : 'move',
                        text : 'Move'
                    },
                    {
                        block : 'button',
                        mods : { theme : 'islands', size : 'xl', action: 'true' },
                        name : 'download',
                        text : 'Download'
                    },
                    {
                        block : 'button',
                        mods : { theme : 'islands', size : 'xl', action: 'true' },
                        name : 'delete',
                        text : 'Delete'
                    },
                    {
                        block : 'button',
                        mods : { theme : 'islands', size : 'xl', action: 'true' },
                        name : 'all',
                        text : 'Select all'
                    },
                    {
                        block : 'button',
                        mods : { theme : 'islands', size : 'xl', action: 'true' },
                        name : 'deselect',
                        text : 'Select none'
                    },
                    {
                        block : 'button',
                        mods : { theme : 'islands', size : 'xl', action: 'true' },
                        name : 'inverse',
                        text : 'Inverse selection'
                    }
                ]
            },
            {
                block: 'panel',
                mods : { position : 'left' }
            },
            {
                block: 'divider'
            },
            {
                block: 'disabler'
            },
            {
                block : 'confirm',
                content : [
                    {
                        block : 'popup',
                        mods : { theme: 'islands', target : 'position' },
                        directions : ['top-center'],
                        content : [
                            {
                                block : 'question'
                            }
                        ]
                    },
                    {
                        block : 'popup',
                        mods : { theme: 'islands', target : 'position', 'with-destination': 'true' },
                        directions : ['top-center'],
                        content : [
                            {
                                block : 'question',
                                mods : { 'with-destination': 'true' },
                            }
                        ]
                    },
                    {
                        block : 'popup',
                        mods : { theme: 'islands', target : 'position', simple: 'true' },
                        directions : ['top-center'],
                        content : [
                            {
                                block : 'question',
                                mods : { simple: 'true' } ,
                            }
                        ]
                    }
                ]
            },            
            {
                block: 'panel',
                mods : { position : 'right' }
            },
            {
                block: 'info'
            },
        ]
    }]
});
