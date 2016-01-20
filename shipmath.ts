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

export function dist(x1: number, y1: number, x2: number, y2: number){
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

export function x_comp(h:number){
  return Math.cos(h * Math.PI / 180);
}
export function y_comp(h:number){
  return Math.sin(h * Math.PI / 180);
}
