/**
 * this is the plot object, used for creating new instances of graphs.
 */
class plot {
    /**
     * Creates a new instance of the plot object.
     * @param {HTMLElement} container - parent HTMLElement where the canvas will be inserted.
     * @param {Object=} options - options object needed to configure the plot instance
     * @param {String} [options.color = {}] - Object container used for setting colors
     * @param {String} [options.color.grid = "#ddd"] - string of the CSS color value used for rendering the grid
     * @param {String} [options.color.axis = "#800"] - string of the CSS color value used for rendering the axis
     * @param {String} [options.color.axisLabel = "#444"] - string of the CSS color value used for rendering both X and Y axis labels
     * @param {String} [options.color.axisLabelX = "#444"] - string of the CSS color value used for rendering the X axis labels
     * @param {String} [options.color.axisLabelY = "#444"] - string of the CSS color value used for rendering the Y axis label
     * @param {String} [options.color.labelX = "#444"] - string of the CSS color value used for rendering X axis numbers
     * @param {String} [options.color.labelY = "#444"] - string of the CSS color value used for rendering Y axis numbers
     * @param {Boolean} [options.labels = true] - flag for rendering labels on the axis of the graph
     * @param {Boolean} [options.initRender = true] - flag for whether the function should render after created
     * @param {Function=} options.callback(this) - function to be called after creation
     * @param {Function=|Boolean=} options.hammerize - constructor for Hammer (looks for global constructor `Hammer` if `true`)
     */
    constructor(container, options){
        const element = document.createElement('canvas'); // setup canvas element to be inserted into the parent container

        // make dummy object if user does not pass an object as the second parameter
        options = (typeof options === "object") ? options : {};

        // setup container Array for functions
        // empty array where rendered functions are stored (as either functions or objects with restrictions)
        /**
         * Storage for the functions to be rendered by the function
         * @type {Array}
         */
        this.functions = [];

        // setup default color options (assumes it's an object)
        options.color = (typeof options.color === "object") ? options.color : {};
        let axisLabel = (typeof options.color.axisLabel === "string") ? options.color.axisLabel : '';

            this.color = {
            grid: (typeof options.color.grid === 'string') ? options.color.grid : '#ddd',
            axis: (typeof options.color.axis === 'string') ? options.color.axis : '#888',
            axisLabelX: (typeof options.color.axisLabelX === 'string') ? options.color.axisLabelX : axisLabel || '#444',
            axisLabelY: (typeof options.color.axisLabelY === 'string') ? options.color.axisLabelY : axisLabel || '#444',
            labelX: (typeof options.color.labelX === 'string') ? options.color.labelX : '#444',
            labelY: (typeof options.color.labelY === 'string') ? options.color.labelY : '#444',
        };

        // setup rendering rate option/default
        this.redrawRate = (typeof options.redrawRate === "number") ? options.redrawRate :  33;

        // setup label option/default
        this.labels = (typeof options.labels === "boolean") ? options.labels : true;

        // setup rendering option/default
        this.renderFunctions = (typeof options.renderFunctions === "boolean") ? options.renderFunctions : true;

        // setup scaling options/defaults
        this.scaleX = (typeof options.scaleX === "number") ? options.scaleX : 1;
        this.scaleY = (typeof options.scaleY === "number") ? options.scaleY : 1;

        // setup graph offset options/defaults
        this.offsetX = (typeof options.offsetX === "number") ? options.offsetX : 0;
        this.offsetY = (typeof options.offsetY === "number") ? options.offsetY : 0;

        // setup graph panning options/defaults (used for panning events)
        this.panX = (typeof options.panX === "number") ? options.panX : 0;
        this.panY = (typeof options.panY === "number") ? options.panY : 0;

        // setup custom font-size
        this.labelSize = (typeof options.labelSize === "number") ? options.labelSize : 10;
        this.axisLabelSize = (typeof options.axisLabelSize === "number") ? options.axisLabelSize : 18;

        // setup the flag for whether the graph will auto render once created
        options.initRender = (typeof options.initRender === "boolean") ? options.initRender : true;

        // make unique identifier using the prototype method
        const uid = this._UID();

        // setup the unique event-handler id that will be bound to the Window object
        this.resizeTimeoutID = '_plot-resize-' + uid;

        element.style.cursor = 'inherit'; // set cursor styles to inherit from container

        container.innerHTML = ''; // get rid of any html that will interfere with canvas rendering
        container.style.overflow = 'hidden'; // prevents weird scrollbar glitches

        // bind the canvas element to the object and to the container as a child element
        container.appendChild(this.canvas = element);

        console.log(typeof options.hammerize, options.hammerize);

        switch (typeof options.hammerize){
            case "function":
                // attempt to pass the function as a constructor ToDo: add better verification for Hammer
                this.hammerize(options.hammerize);
                break;
            case "boolean":
                // if the statement is true
                if (options.hammerize){
                    if (typeof window.Hammer === "function"){
                        this.hammerize(window.Hammer);
                    } else {
                        console.warn('no global Hammer constructor is preset, ignoring')
                    }
                }
                break;
            case "undefined":
                // do nothing
                break;
            default:
                console.warn('unrecognized Hammer constructor is preset, ignoring')
        }

        // initialize the graph if the flag is set
        if (options.initRender){

            this.adjustSize()
                .goToOrigin()
                .redraw();
        }
    }

    /**
     * simple macro functions for math operations
     * @returns {String} - An unique identifier
     * @private
     */
    _UID(){
        let r = () => { return (( (1 + Math.random() ) * 0x10000) | 0).toString(16).substring(1); };
        return (r() + r() + r() + r() + r());
    }

    /**
     *
     * @param num
     * @param x
     * @returns {number}
     * @private
     */
    _roundBaseX(num, x) {
        return Math.pow(x, Math.floor(this._getBaseLog(x, num)));
    }

    _getBaseLog(x, y) {
        return Math.log(y) / Math.log(x);
    }

    _strip(number) {
        return (parseFloat(number.toPrecision(4)));
    }

    _stripFixed(number) {
        return (parseFloat(number.toFixed(6)));
    }
    
    _isArray(object){
        return (typeof object === "object" && typeof object.length === "number")
    }
    /**
     * Pseudo-hidden drawing methods
     * @param {HTMLElement} canvas
     * @private
     */
    _clearCanvas(canvas){
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }

    _drawIntercepts(){
        let graph = this.canvas,
            width = graph.width,
            height = graph.height,
            dX = -this.offsetX,
            dY = -this.offsetY,
            plot = graph.getContext('2d');

        plot.strokeStyle = this.color.axis;
        plot.lineWidth = 1;

        plot.font = `bold ${ this.axisLabelSize }px Arial`;

        plot.fillStyle = this.color.axisLabelY;

        if (dX >= 0 && dX <= width) {
            plot.beginPath();
            plot.moveTo(dX, 0);
            plot.lineTo(dX, height);
            plot.closePath();

            (dY > 10) && plot.fillText("y", dX + 9, 20);
            (dY < height) && plot.fillText("-y", dX + 9, height - 10);

            plot.stroke();
        }

        plot.fillStyle = this.color.axisLabelX;

        if (dY >= 0 && dY <= height) {

            plot.beginPath();
            plot.moveTo(0, dY);
            plot.lineTo(width, dY);
            plot.closePath();

            (dX > 10) && plot.fillText("-x", 10, dY + 16);
            (dX < width) && plot.fillText("x", width - 20, dY + 16);

            plot.stroke();
        }
    }

    _drawGrid(){
        let graph = this.canvas,
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
            xAxis = [], yAxis = [], start = 0, i, dX, dY, k, hv;

        plot.strokeStyle = this.color.grid;
        plot.lineWidth = 1;

        plot.font = `bold ${ this.labelSize }px Arial`;
        plot.textBaseline = "middle";

        plot.beginPath();

        // X Grid

        if (offsetX > 0) start = Math.ceil((offsetX / scaleX) / intervalX) * intervalX;
        else if (offsetX < 0) start = Math.floor((offsetX / scaleX) / intervalX) * intervalX;

        i = ~~((width / scaleX) / intervalX) + 2;

        while (i--) {
            k = start + intervalX * i;
            dX = (k * scaleX) - offsetX;

            plot.moveTo(dX, 0);
            plot.lineTo(dX, height);
            xAxis[i] = [stripFixed(k), dX];
        }

        // Y Grid

        if (offsetY < 0) start = Math.floor(((offsetY) / scaleY) / intervalY) * intervalY;
        else if (offsetY > 0) start = Math.ceil(((offsetY) / scaleY) / intervalY) * intervalY;
        else start = 0;

        i = ~~((height / scaleY) / intervalY) + 2;

        while (i--) {
            k = start + intervalY * i;
            dY = (k * scaleY) - offsetY;

            plot.moveTo(0, dY);
            plot.lineTo(width, dY);
            yAxis[i] = [stripFixed(-k), dY];
        }

        plot.closePath();
        plot.stroke();

        i = xAxis.length;

        if (this.labels) {

            plot.fillStyle = this.color.labelX;

            hv = this.labelSize / 2; // vertical spacer

            while (i--) {
                k = xAxis[i][0];
                plot.fillText(k, xAxis[i][1] - plot.measureText(k).width / 2, 6 + hv);
            }

            plot.fillStyle = this.color.labelY;

            i = yAxis.length;
            while (i--) plot.fillText(yAxis[i][0] + '', 4, yAxis[i][1]);
        }
    }

    _drawFunction(expression, args){
        if (typeof expression !== "function") return; // give up rendering if the object isn't a function

        args = typeof args === "object" ? args : {};

        let graph = this.canvas,
            offsetX = this.offsetX,
            offsetY = this.offsetY,
            scaleX = this.scaleX,
            scaleY = this.scaleY,
            width = (typeof args.width === "number") ? args.width : graph.width, // isolate in case of unexpected width change during rendering.
            min = (typeof args.min === "number") ? args.min : offsetX / scaleX,
            max = (typeof args.max === "number") ? args.max : (width + offsetX) / scaleX,
            viewX = (min * scaleX) - offsetX;

        if (viewX > width || min >= max) return; // out of bounds

        let plot = graph.getContext('2d'),
            lastY = -expression(min) * scaleY - offsetY,
            dX;

        plot.strokeStyle = (typeof args.color === "string") ? args.color : '#000000';
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


    _resizeWindowEvent(e){
        let self = this;
        clearTimeout(window[self.resizeTimeoutID]);
        window[self.resizeTimeoutID] = setTimeout(function () {
            self.adjustSize().redraw();
        }, self.redrawRate);
    }

    // event handlers for panning events
    _panStartEvent(e){
        // cache current offsets before changes occur
        this.panX = this.offsetX;
        this.panY = this.offsetY;
        this.canvas.parentNode.style.cursor = 'grabbing'; // set cursor on desktops
    }

    _panMoveEvent(e){
        this.offsetX = this.panX - e.deltaX;
        this.offsetY = this.panY - e.deltaY;

        this.redraw(true);
    }

    _panEndEvent(e){
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
    drawFunctions(customFunctions){
        // allows user to override stored functions and pass a dynamic array to be rendered
        const fcns = (this._isArray(customFunctions) && customFunctions.length > 0) ? customFunctions : this.functions;

        if (!this._isArray(fcns)){
            console.warning('invalid input object, skipping rendering phase');
            return this;
        }

        let i = fcns.length, fcn, fcnArgs;

        while(i--){
            fcn = fcns[i];
            fcnArgs = {width: this.canvas.width}; // cache width
            switch (typeof fcn){
                case "function":
                    // draw the function without any fancy style (yet)
                    this._drawFunction(fcn, fcnArgs);
                    break;
                case "object":
                    if (typeof fcn['fcn'] === "function"){
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
    setPosition(X, Y){
        this.offsetX = (typeof X === "number") ? X : this.offsetX;
        this.offsetY = (typeof Y === "number") ? Y : this.offsetY;
        return this;
    }

    /**
     * Sets position to specified X coordinate
     * @param {Number} [X=this.offsetX]
     * @returns {plot}
     */
    setPositionX(X){
        this.offsetX = (typeof X === "number") ? X : this.offsetX;
        return this;
    }

    /**
     * Sets position to specified Y coordinate
     * @param {Number} [Y=this.offsetY]
     * @returns {plot}
     */
    setPositionY(Y){
        this.offsetY = (typeof Y === "number") ? Y : this.offsetY;
        return this;
    }

    /**
     * Sets position to the graph origin (X=0, Y=0)
     * @returns {plot}
     */
    goToOrigin(){
        this.offsetX = ~~(- (this.canvas.width) / 2);
        this.offsetY = ~~(- (this.canvas.height) / 2);
        return this;
    }

    // gets canvas position from scaled X coordinate
    getScalePositionX(X){
        return  -(this.canvas.width / 2) + X * this.scaleX;
    }

    // gets canvas position from scaled Y coordinate
    getScalePositionY(Y){
        return  -(this.canvas.height / 2) + Y * this.scaleY;
    }


    // reverse to find real x
    /*
    * offsetX = -(A / 2) + graphX * S;
    *
    * offsetX + (A / 2) = graphX * S;
    *
    * (offsetX + (A / 2)) / S = graphX
    *
    * */

    getCanvasX(cX){
        return (cX + (this.canvas.width / 2)) / this.scaleX;
    }

    /**
     * Animates either X or Y (or both) by specific amounts
     * @param deltas {Object=} - Object containing deltas to be animated
     * @param deltas.x {Number=} - The change in X from current position
     * @param deltas.y {Number=} - The change in Y from current position
     * @param callback - the code executed after animation completes
     * @param duration - the duration of the animation in milliseconds
     */
    animate(deltas, callback, duration){
        // step 1: get the current Canvas position of the middle of the viewport
        // step 2: get the future position of the middle of the viewport for new X value
        // s3: calculate the delta between them and set that as the end position
        // s4: animate it until it gets there

        deltas = typeof deltas === "object" ? deltas : {};
        deltas.x = typeof deltas.x === "number" ? deltas.x : 0;
        deltas.X = typeof deltas.X === "number" ? deltas.X : 0;

        deltas.y = typeof deltas.y === "number" ? deltas.y : 0;
        deltas.Y = typeof deltas.Y === "number" ? deltas.X : 0;

        callback = typeof callback === "function" ? callback : () => {}; // dummy callback function

        const self = this,
            startCanvasX = self.offsetX,
            startCanvasY = self.offsetY,
            targetCanvasX = startCanvasX + (deltas.x || delta.X) * self.scaleX,
            targetCanvasY = startCanvasY + (deltas.y || delta.Y) * self.scaleY,
            dX = targetCanvasX - startCanvasX,
            dY = startCanvasY - targetCanvasY;

        duration = typeof duration === "number" ? duration : 1750;

        const easeInOutCubic = function (t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
            return c / 2 * ((t -= 2) * t * t + 2) + b;
        };

        console.log(startCanvasX, targetCanvasX);

        let startTime = null,
            animateFrame = () => {}; // dummy function to prevent errors

        // optimize animation depending on whether or not deltas are set;

        if (deltas.x && deltas.y){
            // both delta are set animate both
            animateFrame = timestamp => {
                startTime = startTime || timestamp;
                let elapsed = (timestamp - startTime);
                self
                    .setPositionX(easeInOutCubic(elapsed, startCanvasX, dX, duration))
                    .setPositionY(easeInOutCubic(elapsed, startCanvasY, dY, duration))
                    .redraw(true);

                (elapsed < duration) ? requestAnimationFrame(animateFrame) : callback();
            }
        } else if (deltas.x){
            // only change in x is present
            animateFrame = timestamp => {
                startTime = startTime || timestamp;
                let elapsed = (timestamp - startTime);
                self.setPositionX(easeInOutCubic(elapsed, startCanvasX, dX, duration))
                    .redraw(true);

                (elapsed < duration) ? requestAnimationFrame(animateFrame) : callback();
            }
        } else if (deltas.y){
            // only change in y is present
            animateFrame = timestamp => {
                startTime = startTime || timestamp;
                let elapsed = (timestamp - startTime);
                self.setPositionY(easeInOutCubic(elapsed, startCanvasY, dY, duration))
                    .redraw(true);

                (elapsed < duration) ? requestAnimationFrame(animateFrame) : callback();
            }
        }

        requestAnimationFrame(animateFrame);
        return this;
    }

    /**
     * Animates either X or Y (or both) to a specific coordinate on the graph
     * @param coord {Object=} - Object containing deltas to be animated
     * @param coord.x {Number=} - The position in X to animate
     * @param coord.y {Number=} - The position in Y to animate
     * @param callback - the code executed after animation completes
     * @param duration - the duration of the animation in milliseconds
     */
    animateToCoordinate(coord, callback, duration){
        coord = typeof coord === "object" ? coord : {};

        let dX, dY, doAnimation = false;

        if (typeof coord.x === "number"){
            let currentX = (this.offsetX + (this.canvas.width / 2)) * this.scaleX;
            dX = coord.x - currentX;
            doAnimation = true;
        }

        if (typeof coord.y === "number"){
            let currentY = (this.offsetY + (this.canvas.height / 2)) * this.scaleY;
            dY = currentY + coord.y;
            doAnimation = true;
        }

        doAnimation && this.animate({x: dX, y: dY}, callback, duration);

        return this;
    }

    /**
     * Animates to origin
     * @param callback - the code executed after animation completes
     * @param duration - the duration of the animation in milliseconds
     */
    animateToOrigin(callback, duration){
        this.animateToCoordinate({x: 0, y: 0}, callback, duration);
        return this;
    }

    /**
     * Adjusts the dimensions of the canvas to match (fill) it's parent container
     * @returns {plot}
     */
    adjustSize(){
        let container = this.canvas.parentNode;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        return this;
    }

    /**
     * Initializes a new Hammer instance to allow desktop/mobile moving
     * @param {Function} - The Hammer constructor
     * @returns {plot}
     */

    hammerize(hammerFactory){
        if (typeof hammerFactory === "function") {

            // bind resize event handlers
            window.addEventListener('resize', this._resizeWindowEvent.bind(this));

            let hammer = new hammerFactory(this.canvas);

            hammer.on('panstart', this._panStartEvent.bind(this));
            hammer.on('panmove', this._panMoveEvent.bind(this));
            hammer.on('panend', this._panEndEvent.bind(this));

        } else {
            console.warn('invalid Hammer constructor passed as arg')
        }

        return this;
    }

    /**
     * Sets position to the graph origin (X=0, Y=0)
     * @param {Boolean} [clear=false] - Decides if the canvas should be cleared before redrawing the grid and functions
     * @returns {plot}
     */
    redraw(clear){
        clear && this._clearCanvas(this.canvas); // clear when set to `true`
        this.renderFunctions && this.drawFunctions();
        this._drawGrid();
        this._drawIntercepts();
        return this
    }
}

if (typeof module !== "undefined"){
    module.exports = plot;
}