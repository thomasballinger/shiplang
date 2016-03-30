import { Entity, Ship as ShipEntity } from './entity';
import { Engine } from './engine';
import { System } from './universe';
import { spriteId, getSpritePath, spriteSize } from './sprite';

//TODO invert y axis

export class SpaceDisplay{
    constructor(id: string, public psfOrig: number, public esfOrig: number, public hud=false, public showStars=true, public bgParallax?: number){
        this.canvas = <HTMLCanvasElement>document.getElementById(id);
        this.ctx = this.canvas.getContext('2d');
        this.starDensity = .000005
        this.starTileSize = 5000
        this.starfield = this.makeStarfield(this.starDensity, this.starTileSize);
        this.active = true;

        this.zoom = -2;
        this.zoomTarget = -2;
        this.psf = this.psfOrig * Math.pow(2, this.zoom/2);
        this.esf = this.esfOrig * Math.pow(2, this.zoom/2);
    }
    psf: number;
    esf: number;
    starDensity: number;
    starfield: [number, number][];
    starTileSize: number;

    zoomTarget: number;
    zoom: number;

    active: boolean;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    update(center: {x: number, y: number}, drawables: {x: number, y:number}[]){
        if (!this.active){ return; }
        if (center === undefined){ throw Error("Centered entity cannot be undefined"); }
        if (this.zoomTarget !== this.zoom){
            this.zoom = (this.zoom * 29 + this.zoomTarget) / 30;
            if (Math.abs(this.zoom - this.zoomTarget) < .01){
                this.zoom = this.zoomTarget;
            }

            this.psf = this.psfOrig * Math.pow(2, this.zoom/2);
            this.esf = this.esfOrig * Math.pow(2, this.zoom/2);
        }
        this.renderCentered(center, drawables, this.psf, this.esf, this.hud, this.showStars, this.bgParallax);
    }
    hide(){ this.active = false; this.canvas.hidden = true; }
    show(){ this.active = true; this.canvas.hidden = false; }
    renderCentered(centered: {x: number, y:number}, drawables: {x: number, y:number}[],
                   positionScaleFactor:number, entityScaleFactor:number,
                   hud=false, drawStars=true, bgp?: number){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        var left = centered.x-this.canvas.width/2/positionScaleFactor;
        var top = centered.y-this.canvas.height/2/positionScaleFactor;
        var right = centered.x+this.canvas.width/2/positionScaleFactor;
        var bottom = centered.y+this.canvas.height/2/positionScaleFactor;

        if (drawStars){
            this.drawStars(left, top, right, bottom, positionScaleFactor);
        }
        this.renderEntities(drawables, left, top, right, bottom,
                    positionScaleFactor, entityScaleFactor, hud);
        if (bgp !== undefined){

            var scale = bgp * Math.pow(2, this.zoom/2);
            this.canvas.style.backgroundPosition=''+(0-centered.x*scale)+' '+(0-centered.y*scale);
        }
    }
    renderEntities(drawables: {x: number, y:number}[], left: number, top: number, right: number, bottom: number,
           position_scale_factor: number, entity_scale_factor: number, hud=false){
        var onscreen = this.getVisible(drawables, left, top, right, bottom); //TODO profile: does this make a difference?
        for (var i=0; i<onscreen.length; i++){
            var drawable = onscreen[i];
            if (drawable instanceof Entity){
                entityDraw(drawable, this.ctx, left, top, position_scale_factor, entity_scale_factor, hud);
            } else if (drawable instanceof System){
                systemDraw(drawable, this.ctx, left, top, position_scale_factor, entity_scale_factor);
            }
            // Given the world-space
        }
    };
    getVisible(drawables: {x: number, y:number}[], left: number, top: number, right: number, bottom: number): {x: number, y: number}[]{
        left -= 100;
        right += 100;
        top -= 100;
        bottom += 100;
        return drawables.filter(function(e){
            return (e.x > left && e.x < right && e.y > top && e.y < bottom)
        })
    }
    drawStars(left: number, top: number, right: number, bottom: number, psf: number){
        // For each tile, how many stars to render
        var starsToUse = Math.max(Math.ceil(psf * psf* this.starfield.length), 1);
        // TODO based on a tile's offset from (0, 0), use different subsets of stars

        var ctx = this.ctx;
        ctx.fillStyle = '#666666';

        var offsets: [number, number][] = [];
        var leftOffset = Math.floor(left / this.starTileSize);
        var topOffset =  Math.floor(top / this.starTileSize);
        var rightOffset = Math.ceil(right / this.starTileSize);
        var bottomOffset = Math.ceil(bottom / this.starTileSize);

        var numTiles = (rightOffset - leftOffset) * (bottomOffset - topOffset);
        var skipRatio = Math.max(1 - psf*psf*this.starfield.length, 0);

        // For each tile of stars
        for (var dx = leftOffset; dx < rightOffset; dx++){
            for (var dy = topOffset; dy < bottomOffset; dy++ ){
                if (skipRatio !== 0){
                    if (skipRatio > .50 && (dx + dy) % 2){ continue; }
                    //TODO to allow further zoom-outs don't render
                    //some tiles
                }

                var dxpx = dx * this.starTileSize;
                var dypx = dy * this.starTileSize;
                var stride = Math.abs(dy * 50 + dx) + 1
                var offset = (Math.abs(dy + 4 * dx) + 1) % this.starTileSize;

                for (var i=offset; i<starsToUse+offset; i++){
                    var screenX = (this.starfield[i*stride%this.starfield.length][0] - left + dxpx)*psf;
                    var screenY = (this.starfield[i*stride%this.starfield.length][1] -  top + dypx)*psf;
                    var size = this.starfield[i*stride%this.starfield.length][2];
                    ctx.fillRect(screenX, screenY, size, size);
                }
            }
        }
    }
    makeStarfield(starDensity: number, tileSize: number){
        var stars: [number, number, number][] = [];
        var numStars = Math.ceil(starDensity * tileSize * tileSize) *10;
        for (var i=0; i<numStars; i++){
            stars.push([Math.floor(Math.random()*tileSize),
                        Math.floor(Math.random()*tileSize),
                        Math.random() > .8 ? 2 : 1]);
        }
        return stars;
    }
    zoomOut(){
        this.zoomTarget = Math.max(-16, this.zoomTarget - 1);
    }
    zoomIn(){
        this.zoomTarget = Math.min(2, this.zoomTarget + 1);
    }
    zoomTo(n: number){
        this.zoom = n;
        this.zoomTarget = n;
        this.psf = this.psfOrig * Math.pow(2, this.zoom/2);
        this.esf = this.esfOrig * Math.pow(2, this.zoom/2);
    }
}

function systemDraw(e: System, ctx: CanvasRenderingContext2D, dx: number, dy: number, psf: number, esf: number): void{
  ctx.font="16px Arial";
  ctx.fillStyle="#ffffff";
  ctx.strokeStyle="#ffffff";
  ctx.lineWidth = 2*esf;
  ctx.beginPath();
  ctx.arc((e.x-dx)*psf, (e.y-dy)*psf, 6*esf, 0, 2*Math.PI);
  ctx.stroke();
  ctx.fillStyle="#888888";
  ctx.fillText(e.id, (e.x-dx)*psf+8*esf, (e.y-dy)*psf + 2*esf);
  ctx.strokeStyle="#ffffff";
  for (var link of e.links){
      ctx.beginPath();
      ctx.moveTo((e.x-dx)*psf,(e.y-dy)*psf);
      ctx.lineTo((link.x-dx)*psf, (link.y-dy)*psf);
      ctx.stroke();
  }
}

function entityDraw(e: Entity, ctx: CanvasRenderingContext2D, dx: number, dy: number, psf: number, esf: number, hud=false): void{
  //dx and dy are offsets in world space for panning
  // psf is position scale factor, used to place ships
  // esf is entity scale factor, used to scale ship dimensions
  if (e instanceof ShipEntity){
      if (hud && e.type === 'explosion'){
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
          return;
      }

      //TODO pass this in
      function hudColor(e: Entity){
          return '#eeeeee';
      }

      if (!e.drawStatus['sprite']){ throw Error('no sprite for '+e.type); }
      if (hud && e.type !== 'explosion'){
          var path = getSpritePath(e.drawStatus['sprite']);
          var [w, h] = spriteSize(e.drawStatus['sprite']);
          var theta = e.h + 90;

          ctx.save();
          ctx.translate((e.x - dx) * psf, (e.y - dy) * psf);
          if (!e.drawStatus['notDirectional']){
              ctx.rotate(theta*Math.PI/180);
          }
          ctx.scale(esf, esf);

          if (e.thrust > 0 && !e.drawStatus['thrustSprite']){
              ctx.fillStyle = e.drawStatus["engineColor"] || "#882200";
              var eWidth = 6
              var eHeight = 12
              for (var engSpot of e.drawStatus['engines']){
                  var [ex, ey] = <[number, number]><any>engSpot;
                  ctx.fillRect(ex-eWidth/2, ey, eWidth, eHeight);
              }
          }

          ctx.translate(-(w/2), -(h/2));

          ctx.fillStyle = hudColor(e);
          ctx.moveTo(path[path.length-1][0], path[path.length-1][1]);
          ctx.beginPath();
          for (var spot of path){
              ctx.lineTo(spot[0], spot[1]);
          }
          ctx.closePath();
          ctx.fill();

          (<any>ctx).restore();

          //shipDraws[e.type](e, ctx, dx, dy, psf, esf, hud);
      } else {

        if (e.type === 'explosion'){
            var imgid = spriteId('effect/explosion/big~1');
        } else if (e.thrust > 0 && e.drawStatus['thrustSprite']){
            var imgid = spriteId(e.drawStatus['thrustSprite']);
        } else {
            var imgid = spriteId(e.drawStatus['sprite']);
        }
        var sprite = <HTMLImageElement>document.getElementById(imgid);
        if (sprite === null){
            throw Error("Can't find sprite with id "+imgid);
        }
        var w = sprite.naturalWidth * esf;
        var h = sprite.naturalHeight * esf;

        var theta = e.h + 90;

        var onscreenX = (e.x - dx) * psf - ctx.canvas.width / 2
        var onscreenY = (e.y - dy) * psf - ctx.canvas.height / 2
        var rotatedX = onscreenX * Math.cos(theta * Math.PI / 180) - onscreenY * Math.sin(theta * Math.PI / 180);
        var rotatedY = onscreenX * Math.sin(theta * Math.PI / 180) + onscreenY * Math.cos(theta * Math.PI / 180);

        ctx.save();
        ctx.translate((e.x - dx) * psf, (e.y - dy) * psf);
        if (!e.drawStatus['notDirectional']){
            ctx.rotate(theta*Math.PI/180);
        }
        if (e.thrust > 0 && !e.drawStatus['thrustSprite']){
            for (var engSpot of e.drawStatus['engines']){
                //TODO fix drawStatus type
                var [ex, ey] = <[number, number]><any>engSpot;
                ex *= esf
                ey *= esf
                ctx.fillStyle = e.drawStatus["engineColor"] || "#882200";
                var eWidth = 6 * esf
                var eHeight = 12 * esf
                ctx.fillRect(ex-eWidth/2, ey, eWidth, eHeight);
            }
        }
        ctx.drawImage(sprite, -w/2, -h/2, w, h);
        (<any>ctx).restore();
      }
  } else {
      entityDraws[e.type](e, ctx, dx, dy, psf, esf, hud);
  }

  // This shows the spot used for collision detection
  /*
  ctx.fillStyle="#222222";
  ctx.strokeStyle="#222222";
  ctx.beginPath();
  ctx.arc((e.x-dx)*psf, (e.y-dy)*psf, e.r*psf, 0, 2*Math.PI);
  ctx.stroke();
  */
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

type EntityDrawFunc = (e: Entity, ctx:CanvasRenderingContext2D, dx:number, dy:number, psf:number, esf:number, hud?: boolean)=>void;
type ShipDrawFunc = (e: ShipEntity, ctx:CanvasRenderingContext2D, dx:number, dy:number, psf:number, esf:number, hud?: boolean)=>void;

var entityDraws = <{[type:string]: EntityDrawFunc}>{
  'laser': function(e, ctx, dx, dy, psf, esf){
    ctx.fillStyle= e.drawStatus['color'] || "#ffff00";
    ctx.beginPath();
    ctx.arc((e.x-dx)*psf, (e.y-dy)*psf, e.r*psf, 0, 2*Math.PI);
    ctx.fill(); //TODO prettier lasers
  },
  'planet': function(e, ctx, dx, dy, psf, esf, hud=false){
    if (hud){
        ctx.fillStyle = "#11ff55";
        ctx.beginPath();
        ctx.arc((e.x-dx)*psf, (e.y-dy)*psf, e.r*psf, 0, 2*Math.PI);
        ctx.fill();
    } else {
        var sprite = <HTMLImageElement>document.getElementById(e.drawStatus['sprite'])
        if (sprite === null){
            throw Error("Can't find sprite with id "+e.drawStatus['sprite']);
        }
        var w = sprite.naturalWidth * esf; //TODO could use precalculated value for this - is that better?

        var theta = e.h;

        var onscreenX = (e.x - dx) * psf - ctx.canvas.width / 2
        var onscreenY = (e.y - dy) * psf - ctx.canvas.height / 2
        var rotatedX = onscreenX * Math.cos(theta * Math.PI / 180) - onscreenY * Math.sin(theta * Math.PI / 180);
        var rotatedY = onscreenX * Math.sin(theta * Math.PI / 180) + onscreenY * Math.cos(theta * Math.PI / 180);

        ctx.save();
        ctx.translate((e.x - dx) * psf, (e.y - dy) * psf);
        ctx.rotate(theta*Math.PI/180);
        ctx.drawImage(sprite, -w/2, -w/2, w, w);
        (<any>ctx).restore();
    }
  }
};
