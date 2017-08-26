# plot.js

Plot.js is a EcmaScript 2015 compliant port of a minimal and performant function plotting library for JavaScript.
This project is intended to be a major part of an upcoming application I am developing.

## How to use
A prebuilt `plot.js` file (that is compatible with older browsers) can be downloaded from the `dist` directory of this
repository or from [here](https://raw.githubusercontent.com/flynnham/plot.js/master/dist/plot.min.js);

In order to use plot.js you must create a Plot object to manipulate the canvas element, as well as bind it's canvas to
the surrounding container.

## Building from source
Clone this repo (or include inside of your `package.json`), and install build dependencies vis `npm i` or `npm install`.
The project can then be built via `npm run build` or  `gulp build`. Updated versions should become avaliable in the `dist` directory. 

## Documentation
Documentation can be built via `gulp docs` once all dependencies are installed. Once built, docs can be found within the
generated `docs` directory. Open the `docs/index.html` file in your browser to view the docs.

**Better README documentation is yet to come!** 
