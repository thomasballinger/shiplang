import { Entity, Ship } from './entity';
import { SpaceWorld } from './space';

export class SpaceDisplay{
    constructor(id: string, public psf: number, public esf: number, public bgp: number){
        this.canvas = <HTMLCanvasElement>document.getElementById(id);
        this.ctx = this.canvas.getContext('2d');
    }
    renderCentered(centered: Entity, entities: Entity[],
                   positionScaleFactor:number, entityScaleFactor:number,
                   backgroundParallax:number){
        this.render(entities,
                    centered.x-this.canvas.width/2/positionScaleFactor,
                    centered.y-this.canvas.height/2/positionScaleFactor,
                    centered.x+this.canvas.width/2/positionScaleFactor,
                    centered.y+this.canvas.height/2/positionScaleFactor,
                    positionScaleFactor,
                    entityScaleFactor);
        this.canvas.style.backgroundPosition=''+(0-centered.x*backgroundParallax)+' '+(0-centered.y*backgroundParallax);
    }
    update(center: Entity, w: SpaceWorld){
        this.renderCentered(center, w.entitiesToDraw(), this.psf, this.esf, this.bgp);
    }
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    render(entities: Entity[], left: number, top: number, right: number, bottom: number,
           position_scale_factor: number, entity_scale_factor: number){
        var onscreen = this.visibleEntities(entities, left, top, right, bottom); //TODO profile: does this make a difference?
        //var onscreen = entities;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (var i=0; i<onscreen.length; i++){
            var entity = onscreen[i];
            entityDraw(entity, this.ctx, left, top, position_scale_factor, entity_scale_factor);
            // Given the world-space
        }
    };
    visibleEntities(entities: Entity[], left: number, top: number, right: number, bottom: number): Entity[]{
        left -= 100;
        right += 100;
        top -= 100;
        bottom += 100;
        return entities.filter(function(e){
            return (e.x > left && e.x < right && e.y > top && e.y < bottom)
        })
    }
}

function entityDraw(e: Entity, ctx:CanvasRenderingContext2D, dx:number, dy:number, psf:number, esf:number):void{
  //dx and dy are offsets in world space for panning
  // psf is position scale factor, used to place ships
  // esf is entity scale factor, used to scale ship dimensions
  if (e instanceof Ship){
      shipDraws[e.type](e, ctx, dx, dy, psf, esf);
  } else {
      entityDraws[e.type](e, ctx, dx, dy, psf, esf);
  }
  ctx.fillStyle="#222222";
  ctx.strokeStyle="#222222";
  ctx.beginPath();
  ctx.arc((e.x-dx)*psf, (e.y-dy)*psf, e.r*psf, 0, 2*Math.PI);
  ctx.stroke();
}

// x and y are in display space
function drawPoly(ctx:CanvasRenderingContext2D, x:number, y:number, points:number[][], h: number, esf:number):void{
  if (esf === undefined){
    esf = 1;
  }
  points = points.map(function(arr){
    var dx = arr[0] * esf, dy = arr[1] * esf;
    return [x + dx * Math.cos(h * Math.PI / 180) - dy * Math.sin(h * Math.PI / 180),
            y + dx * Math.sin(h * Math.PI / 180) + dy * Math.cos(h * Math.PI / 180)];
  });
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (var i = 1; i < points.length; i++){
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
  ctx.fill();
}

type EntityDrawFunc = (e: Entity, ctx:CanvasRenderingContext2D, dx:number, dy:number, psf:number, esf:number)=>void;
type ShipDrawFunc = (e: Ship, ctx:CanvasRenderingContext2D, dx:number, dy:number, psf:number, esf:number)=>void;

var entityDraws = <{[type:string]: EntityDrawFunc}>{
  'laser': function(e, ctx, dx, dy, psf, esf){
    ctx.fillStyle="#ffff00";
    ctx.beginPath();
    ctx.arc((e.x-dx)*psf, (e.y-dy)*psf, e.r*psf, 0, 2*Math.PI);
    ctx.fill(); //TODO prettier lasers
  },
  'planet': function(e, ctx, dx, dy, psf, esf){
    ctx.fillStyle = e.drawStatus['color'] || "#11ff55";
    ctx.beginPath();
    ctx.arc((e.x-dx)*psf, (e.y-dy)*psf, e.r*psf, 0, 2*Math.PI);
    ctx.fill();
  }
};
var shipDraws = <{[type:string]: ShipDrawFunc}>{
  'triangle': function(e, ctx, dx, dy, psf, esf){
    ctx.fillStyle="#eeaa22";
    if (e.thrust > 0){
    drawPoly(ctx,
             (e.x-dx)*psf,
             (e.y-dy)*psf,
             [[-13, -10],
              [-9, -10],
              [-9, 10],
              [-13, 10]],
             e.h,
             esf);
    }
    if (e.drawStatus['scanning']){
      ctx.strokeStyle="#ffeeff";
      ctx.beginPath();
      ctx.arc((e.x-dx)*psf, (e.y-dy)*psf, e.r*10*psf, 0, 2*Math.PI);
      ctx.stroke();
    }
    ctx.fillStyle="#aaeebb";
    drawPoly(ctx,
             (e.x-dx)*psf,
             (e.y-dy)*psf,
             [[15, 0],
              [-10, -12],
              [-10, 12]],
             e.h,
             esf);
  },
  'gunship': function(e, ctx, dx, dy, psf, esf){
    drawPoly(ctx,
             (e.x-dx)*psf,
             (e.y-dy)*psf,
             [[10, 3],
              [-10, 4],
              [-10, -4],
              [10, -3]],
             e.h,
             esf);
  },
  'boid': function(e, ctx, dx, dy, psf, esf){
    ctx.fillStyle="#ffeebb";
    drawPoly(ctx,
             (e.x-dx)*psf,
             (e.y-dy)*psf,
             [[-e.r, -e.r],
              [-e.r, e.r],
              [e.r, e.r],
              [e.r, -e.r]],
             e.h,
             esf);
  },
  'explosion': function(e, ctx, dx, dy, psf, esf){
    ctx.fillStyle="#FFA500";
    drawPoly(ctx,
             (e.x-dx)*psf,
             (e.y-dy)*psf,
             [[-1.3*e.r, -1*e.r],
              [-.9*e.r, 1*e.r],
              [.9*e.r, 1*e.r],
              [1.3*e.r, -1*e.r]],
             e.h,
             esf);
  },
  'dronemissile': function(e, ctx, dx, dy, psf, esf){
    if (e.drawStatus['armed']){
      ctx.fillStyle="#AA1144";
    } else {
      ctx.fillStyle=e.drawStatus['color'] || "#4411AA";
    }
    drawPoly(ctx,
             (e.x-dx)*psf,
             (e.y-dy)*psf,
             [[10, -1],
              [-10, -3],
              [-10, 3],
              [10, 1]],
             e.h,
             esf);
    if (e.thrust > 0){
      ctx.fillStyle="#eeaa22";
      drawPoly(ctx,
               (e.x-dx)*psf,
               (e.y-dy)*psf,
               [[-13, -4],
                [-9, -3],
                [-9, 3],
                [-13, 4]],
               e.h,
               esf);
    }
  },
  'needlemissile': function(e, ctx, dx, dy, psf, esf){
    if (e.drawStatus['armed']){
      ctx.fillStyle="#AA1144";
    } else {
      ctx.fillStyle=e.drawStatus['color'] || "#4488AA";
    }
    drawPoly(ctx,
             (e.x-dx)*psf,
             (e.y-dy)*psf,
             [[7, -1],
              [-7, -2],
              [-7, 2],
              [7, 1]],
             e.h,
             esf);
  },
};
