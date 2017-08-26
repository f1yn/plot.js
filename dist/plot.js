"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * this is the plot object, used for creating new instances of graphs.
 */
var plot = function () {
    /**
     * Creates a new instance of the plot object.
     * @param {HTMLElement} container - parent HTMLElement where the canvas will be inserted.
     * @param {Object=} options - options object needed to configure the plot instance
     * @param {String} [options.color = {}] - Object container used for setting colors
     * @param {String} [options.color.grid = "#ddd"] - string of the CSS color value used for rendering the grid
     * @param {String} [options.color.axis = "#800"] - string of the CSS color value used for rendering the axis
     * @param {String} [options.color.axisLabel = "#444"] - string of the CSS color value used for rendering the axis labels
     * @param {String} [options.color.labelX = "#444"] - string of the CSS color value used for rendering X axis numbers
     * @param {String} [options.color.labelY = "#444"] - string of the CSS color value used for rendering Y axis numbers
     * @param {Boolean} [options.labels = true] - flag for rendering labels on the axis of the graph
     * @param {Boolean} [options.initRender = true] - flag for whether the function should render after created
     * @param {Function=} options.callback(this) - function to be called after creation
     * @param {Function=|Boolean=} options.hammerize - constructor for Hammer (looks for global constructor `Hammer` if `true`)
     */
    function plot(container, options) {
        _classCallCheck(this, plot);

        var element = document.createElement('canvas'); // setup canvas element to be inserted into the parent container

        // make dummy object if user does not pass an object as the second parameter
        options = (typeof options === "undefined" ? "undefined" : _typeof(options)) === "object" ? options : {};

        // setup container Array for functions
        // empty array where rendered functions are stored (as either functions or objects with restrictions)
        /**
         * Storage for the functions to be rendered by the function
         * @type {Array}
         */
        this.functions = [];

        // setup default color options (assumes it's an object)
        options.color = _typeof(options.color) === "object" ? options.color : {};

        this.color = {
            grid: typeof options.color.grid === 'string' ? options.color.grid : '#ddd',
            axis: typeof options.color.axis === 'string' ? options.color.axis : '#888',
            axisLabel: typeof options.color.axisLabel === 'string' ? options.color.axisLabel : '#444',
            labelX: typeof options.color.labelX === 'string' ? options.color.labelX : '#444',
            labelY: typeof options.color.labelY === 'string' ? options.color.labelY : '#444'
        };

        // setup rendering rate option/default
        this.redrawRate = typeof options.redrawRate === "number" ? options.redrawRate : 33;

        // setup label option/default
        this.labels = typeof options.labels === "boolean" ? options.labels : true;

        // setup rendering option/default
        this.renderFunctions = typeof options.renderFunctions === "boolean" ? options.renderFunctions : true;

        // setup scaling options/defaults
        this.scaleX = typeof options.scaleX === "number" ? options.scaleX : 1;
        this.scaleY = typeof options.scaleY === "number" ? options.scaleY : 1;

        // setup graph offset options/defaults
        this.offsetX = typeof options.offsetX === "number" ? options.offsetX : 0;
        this.offsetY = typeof options.offsetY === "number" ? options.offsetY : 0;

        // setup graph panning options/defaults (used for panning events)
        this.panX = typeof options.panX === "number" ? options.panX : 0;
        this.panY = typeof options.panY === "number" ? options.panY : 0;

        // setup the flag for whether the graph will auto render once created
        options.initRender = typeof options.initRender === "boolean" ? options.initRender : true;

        // make unique identifier using the prototype method
        var uid = this._UID();

        // setup the unique event-handler id that will be bound to the Window object
        this.resizeTimeoutID = '_plot-resize-' + uid;

        element.style.cursor = 'inherit'; // set cursor styles to inherit from container

        container.innerHTML = ''; // get rid of any html that will interfere with canvas rendering
        container.style.overflow = 'hidden'; // prevents weird scrollbar glitches

        // bind the canvas element to the object and to the container as a child element
        container.appendChild(this.canvas = element);

        console.log(_typeof(options.hammerize), options.hammerize);

        switch (_typeof(options.hammerize)) {
            case "function":
                // attempt to pass the function as a constructor ToDo: add better verification for Hammer
                this.hammerize(options.hammerize);
                break;
            case "boolean":
                // if the statement is true
                if (options.hammerize) {
                    if (typeof window.Hammer === "function") {
                        this.hammerize(window.Hammer);
                    } else {
                        console.warn('no global Hammer constructor is preset, ignoring');
                    }
                }
                break;
            case "undefined":
                // do nothing
                break;
            default:
                console.warn('unrecognized Hammer constructor is preset, ignoring');
        }

        // initialize the graph if the flag is set
        if (options.initRender) {

            this.adjustSize().goToOrigin().redraw();
        }
    }

    /**
     * simple macro functions for math operations
     * @returns {String} - An unique identifier
     * @private
     */


    _createClass(plot, [{
        key: "_UID",
        value: function _UID() {
            var r = function r() {
                return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
            };
            return r() + r() + r() + r() + r();
        }

        /**
         *
         * @param num
         * @param x
         * @returns {number}
         * @private
         */

    }, {
        key: "_roundBaseX",
        value: function _roundBaseX(num, x) {
            return Math.pow(x, Math.floor(this._getBaseLog(x, num)));
        }
    }, {
        key: "_getBaseLog",
        value: function _getBaseLog(x, y) {
            return Math.log(y) / Math.log(x);
        }
    }, {
        key: "_strip",
        value: function _strip(number) {
            return parseFloat(number.toPrecision(4));
        }
    }, {
        key: "_stripFixed",
        value: function _stripFixed(number) {
            return parseFloat(number.toFixed(6));
        }
    }, {
        key: "_isArray",
        value: function _isArray(object) {
            return (typeof object === "undefined" ? "undefined" : _typeof(object)) === "object" && typeof object.length === "number";
        }
        /**
         * Pseudo-hidden drawing methods
         * @param {HTMLElement} canvas
         * @private
         */

    }, {
        key: "_clearCanvas",
        value: function _clearCanvas(canvas) {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        }
    }, {
        key: "_drawIntercepts",
        value: function _drawIntercepts() {
            var graph = this.canvas,
                width = graph.width,
                height = graph.height,
                dX = -this.offsetX,
                dY = -this.offsetY,
                plot = graph.getContext('2d');

            plot.strokeStyle = this.color.axis;
            plot.lineWidth = 1;
            plot.font = "bold 18px Arial";
            plot.fillStyle = this.color.axisLabel;

            if (dX >= 0 && dX <= width) {
                plot.beginPath();
                plot.moveTo(dX, 0);
                plot.lineTo(dX, height);
                plot.closePath();

                dY > 10 && plot.fillText("y", dX + 9, 20);
                dY < height && plot.fillText("-y", dX + 9, height - 10);

                plot.stroke();
            }

            if (dY >= 0 && dY <= height) {

                plot.beginPath();
                plot.moveTo(0, dY);
                plot.lineTo(width, dY);
                plot.closePath();

                dX > 10 && plot.fillText("-x", 10, dY + 16);
                dX < width && plot.fillText("x", width - 20, dY + 16);

                plot.stroke();
            }
        }
    }, {
        key: "_drawGrid",
        value: function _drawGrid() {
            var graph = this.canvas,
                scaleX = this.scaleX,
                scaleY = this.scaleY,
                offsetX = this.offsetX,
                offsetY = this.offsetY,
                width = graph.width,
                height = graph.height,
                intervalX = (64 / this._roundBaseX(scaleX, 2)).toPrecision(8),
                intervalY = (64 / this._roundBaseX(scaleY, 2)).toPrecision(8),
                plot = graph.getContext('2d'),
                stripFixed = this._stripFixed,
                xAxis = [],
                yAxis = [],
                start = 0,
                i = void 0,
                dX = void 0,
                dY = void 0,
                k = void 0;

            plot.strokeStyle = this.color.grid;
            plot.lineWidth = 1;

            plot.font = "bold 10px Arial";
            plot.textBaseline = "middle";

            plot.beginPath();

            // X Grid

            if (offsetX > 0) start = Math.ceil(offsetX / scaleX / intervalX) * intervalX;else if (offsetX < 0) start = Math.floor(offsetX / scaleX / intervalX) * intervalX;

            i = ~~(width / scaleX / intervalX) + 2;

            while (i--) {
                k = start + intervalX * i;
                dX = k * scaleX - offsetX;

                plot.moveTo(dX, 0);
                plot.lineTo(dX, height);
                xAxis[i] = [stripFixed(k), dX];
            }

            // Y Grid

            if (offsetY < 0) start = Math.floor(offsetY / scaleY / intervalY) * intervalY;else if (offsetY > 0) start = Math.ceil(offsetY / scaleY / intervalY) * intervalY;else start = 0;

            i = ~~(height / scaleY / intervalY) + 2;

            while (i--) {
                k = start + intervalY * i;
                dY = k * scaleY - offsetY;

                plot.moveTo(0, dY);
                plot.lineTo(width, dY);
                yAxis[i] = [stripFixed(-k), dY];
            }

            plot.closePath();
            plot.stroke();

            i = xAxis.length;

            if (this.labels) {

                plot.fillStyle = this.color.labelX;

                while (i--) {
                    k = xAxis[i][0];
                    plot.fillText(k, xAxis[i][1] - plot.measureText(k).width / 2, 10);
                }

                plot.fillStyle = this.color.labelY;

                i = yAxis.length;

                while (i--) {
                    plot.fillText(yAxis[i][0] + '', 4, yAxis[i][1]);
                }
            }
        }
    }, {
        key: "_drawFunction",
        value: function _drawFunction(expression, args) {
            if (typeof expression !== "function") return; // give up rendering if the object isn't a function

            args = (typeof args === "undefined" ? "undefined" : _typeof(args)) === "object" ? args : {};

            var graph = this.canvas,
                offsetX = this.offsetX,
                offsetY = this.offsetY,
                scaleX = this.scaleX,
                scaleY = this.scaleY,
                width = typeof args.width === "number" ? args.width : graph.width,
                // isolate in case of unexpected width change during rendering.
            min = typeof args.min === "number" ? args.min : offsetX / scaleX,
                max = typeof args.max === "number" ? args.max : (width + offsetX) / scaleX,
                viewX = min * scaleX - offsetX;

            if (viewX > width || min >= max) return; // out of bounds

            var plot = graph.getContext('2d'),
                lastY = -expression(min) * scaleY - offsetY,
                dX = void 0;

            plot.strokeStyle = typeof args.color === "string" ? args.color : '#000000';
            plot.lineWidth = 1;

            plot.beginPath();

            while (viewX < width) {
                if ((dX = (viewX + offsetX) / scaleX) > max) break;

                plot.moveTo(viewX++, lastY); // switch ++ with line to to disable antialiased rendering
                plot.lineTo(viewX, lastY = -expression(dX) * scaleY - offsetY);
            }

            plot.closePath();
            plot.stroke();
        }
    }, {
        key: "_resizeWindowEvent",
        value: function _resizeWindowEvent(e) {
            var self = this;
            clearTimeout(window[self.resizeTimeoutID]);
            window[self.resizeTimeoutID] = setTimeout(function () {
                self.adjustSize().redraw();
            }, self.redrawRate);
        }

        // event handlers for panning events

    }, {
        key: "_panStartEvent",
        value: function _panStartEvent(e) {
            // cache current offsets before changes occur
            this.panX = this.offsetX;
            this.panY = this.offsetY;
            this.canvas.parentNode.style.cursor = 'grabbing'; // set cursor on desktops
        }
    }, {
        key: "_panMoveEvent",
        value: function _panMoveEvent(e) {
            this.offsetX = this.panX - e.deltaX;
            this.offsetY = this.panY - e.deltaY;

            this.redraw(true);
        }
    }, {
        key: "_panEndEvent",
        value: function _panEndEvent(e) {
            // clearTimeout(window[this.panTimeoutID]);
            this.panX = this.panY = 0;
            this.canvas.parentNode.style.cursor = ''; // set cursor on desktop
        }

        // globally (intentional) accessible methods

        /**
         *
         * @param {Array} [customFunctions=this.functions] - Renders functions on the plot canvas
         * @returns {plot}
         */

    }, {
        key: "drawFunctions",
        value: function drawFunctions(customFunctions) {
            // allows user to override stored functions and pass a dynamic array to be rendered
            var fcns = this._isArray(customFunctions) && customFunctions.length > 0 ? customFunctions : this.functions;

            if (!this._isArray(fcns)) {
                console.warning('invalid input object, skipping rendering phase');
                return this;
            }

            var i = fcns.length,
                fcn = void 0,
                fcnArgs = void 0;

            while (i--) {
                fcn = fcns[i];
                fcnArgs = { width: this.canvas.width }; // cache width
                switch (typeof fcn === "undefined" ? "undefined" : _typeof(fcn)) {
                    case "function":
                        // draw the function without any fancy style (yet)
                        this._drawFunction(fcn, fcnArgs);
                        break;
                    case "object":
                        if (typeof fcn['fcn'] === "function") {
                            // it's technically valid.
                            this._drawFunction(fcn['fcn'], fcnArgs);
                        }
                        break;
                }
            }
            return this;
        }

        /**
         * Sets position to specified X and Y coordinates
         * @param {NUmber} [X=this.offsetX]
         * @param {NUmber} [X=this.offsetY]
         * @returns {plot}
         */

    }, {
        key: "setPosition",
        value: function setPosition(X, Y) {
            this.offsetX = typeof X === "number" ? X : this.offsetX;
            this.offsetY = typeof Y === "number" ? Y : this.offsetY;
            return this;
        }

        /**
         * Sets position to specified X coordinate
         * @param {Number} [X=this.offsetX]
         * @returns {plot}
         */

    }, {
        key: "setPositionX",
        value: function setPositionX(X) {
            this.offsetX = typeof X === "number" ? X : this.offsetX;
            return this;
        }

        /**
         * Sets position to specified Y coordinate
         * @param {Number} [Y=this.offsetY]
         * @returns {plot}
         */

    }, {
        key: "setPositionY",
        value: function setPositionY(Y) {
            this.offsetY = typeof Y === "number" ? Y : this.offsetY;
            return this;
        }

        /**
         * Sets position to the graph origin (X=0, Y=0)
         * @returns {plot}
         */

    }, {
        key: "goToOrigin",
        value: function goToOrigin() {
            this.offsetX = ~~(-this.canvas.width / 2);
            this.offsetY = ~~(-this.canvas.height / 2);
            return this;
        }

        /**
         * Adjusts the dimensions of the canvas to match (fill) it's parent container
         * @returns {plot}
         */

    }, {
        key: "adjustSize",
        value: function adjustSize() {
            var container = this.canvas.parentNode;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            return this;
        }

        /**
         * Initializes a new Hammer instance to allow desktop/mobile moving
         * @param {Function} - The Hammer constructor
         * @returns {plot}
         */

    }, {
        key: "hammerize",
        value: function hammerize(hammerFactory) {
            if (typeof hammerFactory === "function") {

                // bind resize event handlers
                window.addEventListener('resize', this._resizeWindowEvent.bind(this));

                var hammer = new hammerFactory(this.canvas);

                hammer.on('panstart', this._panStartEvent.bind(this));
                hammer.on('panmove', this._panMoveEvent.bind(this));
                hammer.on('panend', this._panEndEvent.bind(this));
            } else {
                console.warn('invalid Hammer constructor passed as arg');
            }

            return this;
        }

        /**
         * Sets position to the graph origin (X=0, Y=0)
         * @param {Boolean} [clear=false] - Decides if the canvas should be cleared before redrawing the grid and functions
         * @returns {plot}
         */

    }, {
        key: "redraw",
        value: function redraw(clear) {
            clear && this._clearCanvas(this.canvas); // clear when set to `true`
            this.renderFunctions && this.drawFunctions();
            this._drawGrid();
            this._drawIntercepts();
            return this;
        }
    }]);

    return plot;
}();

if (typeof module !== "undefined") {
    module.exports = plot;
}