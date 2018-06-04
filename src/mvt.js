import * as Protobuf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';

export default class MVTPainter {

    constructor(tileTemplateURL) {
        this._tileTemplateURL = tileTemplateURL;
    }
    _getTileUrl(x, y, z) {
        return this._tileTemplateURL.replace('{x}', x).replace('{y}', y).replace('{z}', z);
    }

    loadTile(x, y, z) {
        return fetch(this._getTileUrl(x,y,z))
            .then(rawData => rawData.arrayBuffer())
            .then(response => {
                let geometries = [];
                if (response.byteLength == 0 || response == 'null') {
                    return { empty: true };
                }
                var tile = new VectorTile(new Protobuf(response));
                Object.keys(tile.layers).forEach(function(key) {
                    const layer = tile.layers[key];
                    for (let index = 0; index < layer._features.length; index++) {
                        const feature = layer.feature(index);
                        geometries.push(feature.loadGeometry());
                    }
                });
                return geometries;
            });
    }

    _decomposeLine(source, destination, spacePerPoint) {
        let points = [];
        points.push({x: source.x, y: source.y});
        var deltaX = destination.x - source.x;
        var deltaY = destination.y - source.y;
        var destDistance = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
        var initPoint = source;
        do {
            if (destDistance > spacePerPoint)
            {
                const ratio = spacePerPoint / destDistance;
                const xMove = ratio * deltaX;
                const yMove = ratio * deltaY;
                const newPoint = {x: (xMove + initPoint.x), y: yMove + initPoint.y};
                points.push(newPoint);
                initPoint = newPoint;
                deltaX = destination.x - newPoint.x;
                deltaY = destination.y - newPoint.y;
                destDistance = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
            }
            else
            {
                points.push({x: destination.x, y: destination.y});
                break;
            }
        } while(points.slice(-1).x !== destination.x && points.slice(-1).y !== destination.y);
        return points;
    }

    _drawLine(index, points, ctx, raf, arrow=false) {
        if (index < points.length) {
            let linePoints = this._decomposeLine(points[index-1], points[index], 1000000000);
            ctx.beginPath();
            ctx.moveTo(points[index-1].x, points[index-1].y);
            ctx.stroke();
            ctx.closePath();
            linePoints.forEach((linePoint, i) => {
                ctx.beginPath();
                if (i === 0) {
                    ctx.moveTo(points[index].x, points[index].y);
                }
                ctx.lineTo(linePoint.x, linePoint.y);
                ctx.stroke();
                ctx.closePath();
            });
            if (arrow) {
                //let rot = -Math.atan2(points[index-1].x - points[index].x, points[index-1].y - points[index].y);
                //arrowHead(ctx, points[index].x, points[index].y, rot + Math.PI);
            }
            const that = this;
            raf(function() {
                that._drawLine(index+1, points, ctx,raf);
            });
        }
    }

    _arrowHead(ctx, x, y, rot) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-5, -12);
        ctx.lineTo(5, -12);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }


    drawGeometry(geometry, ctx, raf) {
        const that = this;
        geometry.forEach(points => {
            raf(function() {
                that._drawLine(1, points, ctx,raf);
            });
        });
    }
}

export { MVTPainter };
