/* global MAKE:false */

// process.env.YENV = 'production';

var PATH = require('path');

require('bem-tools-autoprefixer').extendMake(MAKE);

MAKE.decl('Arch', {

    blocksLevelsRegexp: /^.+?\.blocks/,
    bundlesLevelsRegexp: /^.+?\.bundles$/

});

MAKE.decl('BundleNode', {

    getTechs: function () {
        return [
            'bemjson.js',
            'bemdecl.js',
            'deps.js',
            'stylus',
            'css',
            'bemtree',
            'bemhtml',
            'node.js',
            'browser.js+bemhtml',
            'html'
        ];
    },

    getForkedTechs: function () {
        return this.__base().concat(['stylus', 'browser.js+bemhtml', 'node.js']);
    },

    getLevelsMap: function () {
        return {
            desktop: [
                'libs/bem-core/common.blocks',
                'libs/bem-core/desktop.blocks',
                'libs/bem-components/common.blocks',
                'libs/bem-components/design/common.blocks',
                'libs/bem-components/desktop.blocks',
                'libs/bem-components/design/desktop.blocks',
                'common.blocks',
                'desktop.blocks'
            ],
            'touch-pad': [
                'libs/bem-core/common.blocks',
                'libs/bem-core/touch.blocks',
                'libs/bem-core/touch-pad.blocks',
                'libs/bem-components/common.blocks',
                'libs/bem-components/design/common.blocks',
                'libs/bem-components/touch.blocks',
                'libs/bem-components/design/touch.blocks',
                'libs/bem-components/touch-pad.blocks',
                'libs/bem-components/design/touch-pad.blocks',
                'common.blocks',
                'touch.blocks',
                'touch-pad.blocks'
            ],
            'touch-phone': [
                'libs/bem-core/common.blocks',
                'libs/bem-core/touch.blocks',
                'libs/bem-core/touch-phone.blocks',
                'libs/bem-components/common.blocks',
                'libs/bem-components/design/common.blocks',
                'libs/bem-components/touch.blocks',
                'libs/bem-components/design/touch.blocks',
                'libs/bem-components/touch-phone.blocks',
                'libs/bem-components/design/touch-phone.blocks',
                'common.blocks',
                'touch.blocks',
                'touch-phone.blocks'
            ]
        };
    },

    getLevels: function () {
        var resolve = PATH.resolve.bind(PATH, this.root),
            buildLevel = this.getLevelPath().split('.')[0],
            levels = this.getLevelsMap()[buildLevel] || [];

        return levels
            .map(function (path) { return resolve(path); })
            .concat(resolve(PATH.dirname(this.getNodePrefix()), 'blocks'));
    },

    'create-css-node': function (tech, bundleNode, magicNode) {
        var source = this.getBundlePath('stylus');
        if (this.ctx.arch.hasNode(source)) {
            return this.createAutoprefixerNode(tech, this.ctx.arch.getNode(source), bundleNode, magicNode);
        }
    }

});

MAKE.decl('AutoprefixerNode', {

    getPlatform: function () {
        return this.output.split('.')[0];
    },

    getBrowsers: function () {
        var platform = this.getPlatform();
        switch (platform) {
            case 'desktop':
                return [
                    'last 2 versions',
                    'ie 10',
                    'ff 24',
                    'opera 12.16'
                ];

            case 'touch-pad':
                return [
                    'android 4',
                    'ios 5'
                ];

            case 'touch-phone':
                return [
                    'android 4',
                    'ios 6',
                    'ie 10'
                ];
        }

        return this.__base();
    }

});
