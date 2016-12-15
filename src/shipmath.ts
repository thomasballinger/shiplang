type Degrees = number;

export function towardsPoint(x1:number, y1:number, x2:number, y2:number){
    var dx = x2 - x1;
    var dy = y2 - y1;
    return (((Math.atan2(dx, -dy) * 180 / Math.PI) + 270 + 360) + 3600) % 360;
}

export function headingWithin(h1: Degrees, h2: Degrees, dh: Degrees): boolean{
    return (Math.abs(h1 - h2) < dh || Math.abs(h1 + 360 - h2) < dh ||
            Math.abs(h1 - (h2 + 360)) < dh);
}

export function headingDiff(h1: Degrees, h2: Degrees): Degrees{
    return Math.min(Math.abs(h1 - h2), Math.abs(h1 + 360 - h2),
                    Math.abs(h1 - (h2 + 360)));
}

export function headingToLeft(h1: Degrees, h2: Degrees): boolean{
    var diff = (h1 - h2 + 3600) % 360;
    var delta = diff <= 180 ? diff : 360 - diff;
    diff = h2 - h1;
    return (diff > 0 ? diff > 180 : diff >= -180)
}

export function dist(x1: number, y1: number, x2: number, y2: number){
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

export function x_comp(h:number){
    return Math.cos(h * Math.PI / 180);
}
export function y_comp(h:number){
    return Math.sin(h * Math.PI / 180);
}

export function closingSpeed(x1: number, y1: number, dx1: number, dy1: number,
                              x2: number, y2: number, dx2: number, dy2: number){
    var step = 0.01;
    var d1 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
    var d2 = Math.sqrt(Math.pow(x2 + dx2*step - x1 - dx1*step, 2) +
                       Math.pow(y2 + dy2*step - y1 - dy1*step, 2));
    return (d1 - d2) / step;
}

// assuming my current speed,
// assuming their current speed,
// given my projectile speed,
// what heading to face to hit?
//export function intersectHeading(x1: n, y1, dx1, dy1, x2, y2, dx2, dy2){
//
//}
