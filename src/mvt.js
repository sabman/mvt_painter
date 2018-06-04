import * as Protobuf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';

export default class MVTPainter {

    constructor(tileTemplateURL) {
        this._tileTemplateURL = tileTemplateURL;
        this._animationRunning = [];
    }
    _getTileUrl(x, y, z) {
        return this._tileTemplateURL.replace('{x}', x).replace('{y}', y).replace('{z}', z);
    }

    loadTileFromTemplate(x, y, z) {
        const url = this._getTileUrl(x,y,z);
        this.loadTile(url);
    }

    loadTile(url) {
        return fetch(url)
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

    _translatePoints(points, minWidthAndHeight) {
        let translatedPoints = [];
        points.forEach(point => {
            let newPoint = point;
            if (point.x >= minWidthAndHeight.x) {
                newPoint.x -= minWidthAndHeight.x;
            }
            if (point.y >= minWidthAndHeight.y) {
                newPoint.y -= minWidthAndHeight.y;
            }
            translatedPoints.push({x: newPoint.x, y: newPoint.y});
        });
        return translatedPoints;
    }

    _drawLineAllAtOnce(index, points, minWidthAndHeight, ctx) {
        if (index < points.length) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; index < points.length; index++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
            ctx.closePath();
        }
    }

    stopAnimation(index) {
        this._animationRunning[index] = false;
    }

    _drawLine(geometryIndex, index, points, minWidthAndHeight, speed, arrow, ctx, raf) {
        if (this._animationRunning[geometryIndex] && index < points.length) {
            let linePoints = this._decomposeLine(points[index-1], points[index], speed);
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
                let rot = -Math.atan2(points[index-1].x - points[index].x, points[index-1].y - points[index].y);
                this._arrowHead(ctx, points[index].x, points[index].y, rot + Math.PI);
            }
            const that = this;
            raf(function() {
                that._drawLine(geometryIndex, index+1, points, minWidthAndHeight, speed, arrow, ctx,raf);
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

    _getMinWidthAndHeight(geometry) {
        var minX = geometry[0][0].x;
        var minY = geometry[0][0].y;
        geometry.forEach(points => {
            points.forEach(point => {
                if (point.x < minX) {
                    minX=point.x;
                }
                if (point.y < minY) {
                    minY=point.y;
                }
            });
        });

        return {x: minX, y: minY};
    }

    drawGeometry(geometries, index, speed, arrow, ctx, raf) {
        const geometry = geometries[index] ;
        const that = this;
        const minWidthAndHeight = this._getMinWidthAndHeight(geometry);
        this._animationRunning[index] = true;
        geometry.forEach(points => {
            const translatedPoints = this._translatePoints(points, minWidthAndHeight);
            raf(function() {
                that._drawLine(index, 1, translatedPoints, minWidthAndHeight, speed, arrow, ctx,raf);
            });
        });
    }
}

export { MVTPainter };
