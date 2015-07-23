# bem-fm

The file manager with a web interface for .nix systems based on [BEM methodology](https://en.bem.info/method/).

## Main futures

It's fast, async, customizable, and easy to use. 
* The double-decked interface. 
* Current path is displayed and editable. 
* Easy redefinable keyboard shortcuts for all main futures. 
* All settings in one place – `config.json` file. 
* System mounting points detection. You could switch between the points easely. 
* The drive size and free space amount are displayed. 
* Multiple files download is supported. 
* Hard and symbolic link creation. 

## Implementation details

`bem-fm` client side is writen on JS with usage of `i-bem` framework, and the server side on NodeJS. So you can use it in any environment that supports node.

***

NOTE! Windows systems not yet supported.

***

Main libraries used:
* [bem-core](https://github.com/bem/bem-core) v2.6+ – the helpers for work with BEM entities, and events, BEM-flavored JS framework, and other helpful stuff. 
* [bem-components](https://github.com/bem/bem-components) v2.1+ – the set of interface components.
* `vow-fs` – async file system library for NodeJS.
* `express` framework.

## Instalation

You need `npm` 2.5.1 or higher and `node` v0.12.0 to use the app. Clone the repository. To  resolve the dependencies run in the project folder:

```bash
npm i
```


Then you should launch the server:

```bash
node router.node.js
```

It will be available on the `7000` port.
