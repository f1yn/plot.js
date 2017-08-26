/* plotSynth - The graphing calculator of sound
 * Author: Flynn Buckingham
 * Date of Creation: July 13, 2014
 */

var functions = {}, graph = {},
    resizeTimeout, domain,
scalarY = 1, scalarX = 1;

function roundBaseX(num, x) {
    return Math.pow(x, Math.floor(getBaseLog(x, num)));
};

function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
}

function strip(number) {
    return (parseFloat(number.toPrecision(4)));
}

function stripFixed(number) {
    return (parseFloat(number.toFixed(6)));
}

var draw = {
    color: {grid: '#ddd', axis: '#888'},
    fcn: function (expression, args) {
        if (typeof expression !== "function") return;

        args = typeof args === "object" ? args : {};

        var dSet = graph,
            graphElement = graph.element,
            offsetX = Number(dSet.offsetX),
            offsetY = Number(dSet.offsetY),
            scaleX = Number(dSet.scaleX),
            scaleY = Number(dSet.scaleY),
            width = graphElement.width, // isolate in case of unexpected width change during rendering.
            min = typeof args.min !== "undefined" ? Number(args.min) : offsetX / scaleX,
            max = typeof args.max !== "undefined" ? Number(args.max) : (width + offsetX) / scaleX,
            viewX = (min * scaleX) - offsetX;

        if (viewX > width || min >= max) return; // out of bounds

        var plot = graphElement.getContext('2d'),
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
    },
    intercepts: function () {
        var graphElement = graph.element,
            width = graphElement.width,
            height = graphElement.height,
            dX = -Number(graph.offsetX),
            dY = -Number(graph.offsetY),
            plot = graphElement.getContext('2d');

        plot.strokeStyle = this.color.axis;
        plot.lineWidth = 1;
        plot.font = "bold 18px Arial";

        if (dX >= 0 && dX <= width) {
            plot.beginPath();
            plot.moveTo(dX, 0);
            plot.lineTo(dX, height);
            plot.closePath();

            (dY > 10) && plot.fillText("y", dX + 9, 20);
            (dY < height) && plot.fillText("-y", dX + 9, height - 10);

            plot.stroke();
        }

        if (dY >= 0 && dY <= height) {

            plot.beginPath();
            plot.moveTo(0, dY);
            plot.lineTo(width, dY);
            plot.closePath();

            (dX > 10) && plot.fillText("-x", 10, dY + 16);
            (dX < width) && plot.fillText("x", width - 20, dY + 16);

            plot.stroke();
        }
    },
    grid: function () {
        var dSet = graph,
            graphElement = graph.element,
            scaleX = Number(dSet.scaleX),
            scaleY = Number(dSet.scaleY),
            offsetX = Number(dSet.offsetX),
            offsetY = Number(dSet.offsetY),
            width = graphElement.width,
            height = graphElement.height,
            intervalX = (64 / roundBaseX(scaleX, 2)).toPrecision(8),
            intervalY = (64 / roundBaseX(scaleY, 2)).toPrecision(8),
            plot = graphElement.getContext('2d'),
            xAxis = [], yAxis = [], start = 0, i, dX, dY, k;

        plot.strokeStyle = this.color.grid;
        plot.lineWidth = 1;

        plot.font = "bold 10px Arial";
        plot.textBaseline = "middle";
        plot.fontcolor = '#333';

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

        plot.fillStyle = '#444';

        i = xAxis.length;

        if (graph.labels) {
            while (i--) {
                k = xAxis[i][0];
                plot.fillText(k, xAxis[i][1] - plot.measureText(k).width / 2, 10);
            }

            i = yAxis.length;

            while (i--) plot.fillText(yAxis[i][0] + '', 4, yAxis[i][1]);
        }
    },
    functions: function () {
        var fcns = typeof functions !== 'object' ? null : functions.getElementsByClassName('function'),
            fcn, plotcolor;

        if (fcns && fcns.length > 0) {
            for (var i = 0; i < fcns.length; i++) {
                fcn = fcns[i];
                plotcolor = fcn.getAttribute('data-color') ? fcn.getAttribute('data-color') : '#222';
                try {
                    if ($(fcn.domain).hasClass('infinite')) draw.fcn(fcn.expression, {color: plotcolor});
                    else draw.fcn(fcn.expression, {
                        color: plotcolor,
                        max: fcn.domain.max.value,
                        min: fcn.domain.min.value
                    });
                } catch (err) {
                }
            }
        }
    }
}

var graph = {
    element: {},
    labels: true,
    adjustSize: function () {
        var self = this;
        var container = graph.element.parentNode;
        self.element.width = container.clientWidth;
        self.element.height = container.clientHeight;
        return this;
    },
    cleanCanvas: function () {
        var self = this;
        self.element.getContext('2d').clearRect(0, 0, self.element.width, self.element.height);
        return this;
    },
    redraw: function () {
        var self = this;
        self.cleanCanvas();
        draw.grid();
        draw.intercepts();
        return this;
    },
    positionGraphX: function (X) {
        this.offsetX = X;
        return this;
    },
    positionGraphY: function (Y) {
        this.offsetY = Y;
        return this;
    },
    resizeEvent: function (e) {
        this.adjustSize().redraw();
        return this;
    },
    centerX: function () {
        var self = this;
        self.offsetX = ~~(-self.element.width / 2);
        return this;
    },
    centerY: function () {
        var self = this;
        self.offsetY = ~~(-self.element.height / 2);
        return this;
    }
}

/* main event handlers */

function windowResizeEvent() {
    clearTimeout(resizeTimeout);
    graph.adjustSize();
    resizeTimeout = setTimeout(function () {
        graph.redraw()
    }(), 1000);
};

function ready(){
    graph.element = document.getElementById('graph');
    // graph.hammer = new Hammer(graph.element);

   /* graph.hammer.on('panstart', function () {
        panX = Number(graph.offsetX);
        panY = Number(graph.offsetY);
        graph.element.style.cursor = 'inherit';
        document.body.style.cursor = 'grabbing';
    });

    graph.hammer.on('panmove', function (e) {
        graph.offsetX = panX - e.deltaX;
        graph.offsetY = panY - e.deltaY;
        graph.redraw();
    });

    graph.hammer.on('panend', function () {
        panX = panY = 0;
        graph.element.style.cursor = '';
        document.body.style.cursor = '';
    });
*/

    window.addEventListener('resize', windowResizeEvent);

    graph.scaleX = 1;
    graph.scaleY = 1;

   /* $(document.querySelectorAll('a.zoom-button')).bind('click', function (e) {
        var $button = $(this),
            change = 0.5 * ($button.hasClass('zoom-in') ? 1 : -1),
            halfView, centerView, scale;

        if ($button.hasClass('zoom-x')) {
            halfView = Number(graph.element.width) / 2;
            centerView = (halfView + Number(graph.offsetX)) / graph.scaleX;

            scale = strip(Math.pow(2, (scalarX += change) / 2));

            graph.scaleX = (scale > 1) ? scale : scale;
            graph.offsetX = ~~((centerView * graph.scaleX) - halfView);
        }

        if ($button.hasClass('zoom-y')) {
            halfView = Number(graph.element.height) / 2;
            centerView = (halfView + Number(graph.offsetY)) / graph.scaleY;

            scale = strip(Math.pow(2, (scalarY += change) / 2));

            graph.scaleY = (scale > 1) ? scale : scale;
            graph.offsetY = ~~((centerView * graph.scaleY) - halfView);
        }
        graph.redraw();
    });*/

    graph
        .adjustSize()
        .centerX().centerY()
        .redraw();

}

function plot(container, options){
    // should throw if container is not div (HTMLElement) <- screw this! use es6 instead!
    var graph = document.createElement('canvas');
    container.innerHTML = '';
    container.appendChild(graph);

    // do prototypes and stuff
}
