# bem-fm

The file manager with a web interface for .nix servers and desktops based on [BEM methodology](https://en.bem.info/method/).

## Main futures
It's fast, async, customizable, and easy to use.

## Implementation details

`bem-fm` client side is writen on JS, and the server side on NodeJS. So you can use it in any environment that supports node.

Main libraries used:
* [bem-core](https://github.com/bem/bem-core) v2 – the helpers for work with BEM entities, and events, BEM-flavored JS framework, and other helpful stuff. 
* [bem-components](https://github.com/bem/bem-components) v2 – the set of interface components.
* vow-fs – async file system library for NodeJS.
