;(function() {
  'use strict';

  var require;
  if (typeof window === 'undefined') {
    require = module.require;
  } else {
    require = function(name){
      var realname = name.match(/(\w+)[.]?j?s?$/)[1];
      return window[realname];
    };
  }

  var runEntityScript = require('./ai.js').runEntityScript;

  function dist(p1, p2, x2, y2){
    // works with 2 or 4 arguments
    var x1, y1;
    if (x2 === undefined && y2 === undefined) {
      x1 = p1[0];
      y1 = p1[1];
      x2 = p2[0];
      y2 = p2[1];
    } else {
      x1 = p1;
      y1 = p2;
    }
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }

  function x_comp(h){
    return Math.cos(h * Math.PI / 180);
  }
  function y_comp(h){
    return Math.sin(h * Math.PI / 180);
  }

  function drawPoly(ctx, x, y, points, h){
    points = points.map(function(arr){
      var dx = arr[0], dy = arr[1];
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


  // properties all entities are expected to have
  function makeEntity(type, x, y, dx, dy, r){
    return {type: type, x: x, y: y, dx: dx, dy: dy, r:r};
  }

  function makeBoid(x, y, dx, dy, script){
    var boid = makeEntity('boid', x, y, dx, dy, 10);
    if (script === undefined){
      boid.readyCallback = 'done';
    } else {
      boid.script = script;
    }
    boid.h = Math.random() * 360;
    boid.dh = Math.random() * 100 - 50;
    boid.maxThrust = 1;
    boid.maxDH = Math.abs(boid.dh);
    return boid;
  }

  function makeShip(x, y, dx, dy, h, script){
    var ship = makeEntity('ship', x, y, dx, dy, 10);
    ship.h = h;
    ship.thrust = 0;
    ship.maxThrust = 1000;
    ship.maxDH = 300;
    ship.script = script;
    return ship;
  }

  function makeMissile(x, y, dx, dy, h, script){
    var missile = makeEntity('missile', x, y, dx, dy, undefined);
    missile.h = h;
    missile.thrust = 0;
    missile.maxThrust = 300;
    missile.maxDH = 300;
    missile.script = script;
    return missile;
  }

  function fireMissile(e, script){
    return makeMissile(e.x, e.y, e.dx, e.dy, e.h, script);
  }

  function entityMove(e, dt){
    e.x += e.dx * dt;
    e.y += e.dy * dt;
    if (e.hTarget !== undefined){
      var diff = (e.h - e.hTarget + 3600) % 360;
      var delta = diff <= 180 ? diff : 360 - diff;
      diff = e.hTarget - e.h;
      if (diff > 0 ? diff > 180 : diff >= -180){
        e.h = (e.h - Math.min(e.maxDH*dt, delta)) % 360;
      } else {
        e.h = (e.h + Math.min(e.maxDH*dt, delta)) % 360;
      }
      if (delta < 0.01){
        e.hTarget = undefined;
        e.dh = 0;
      }
    } else if (e.dh !== undefined){
      if (e.h === undefined){
        throw Error("e.h is not a number: "+e)
      }
      e.h += e.dh * dt;
    }
    if (e.thrust !== undefined){
      if (e.h === undefined){
        throw Error("e.h is not a number: "+e)
      }
      e.dx += x_comp(e.h) * e.thrust * dt;
      e.dy += y_comp(e.h) * e.thrust * dt;
    }
  }

  function entityDraw(e, ctx, x_offset, y_offset, scale_factor){
    //TODO x and y offsets for panning
    //TODO scale_factor for zooming
    //
    entityDraws[e.type](e, ctx);
    ctx.fillStyle="#222222";
    ctx.lineStyle="#222222";
    ctx.beginPath();
    ctx.arc(e.x,e.y,e.r,0,2*Math.PI);
    ctx.stroke();
  }

  var entityDraws = {
    'boid': function(e, ctx){
      ctx.fillStyle="#ffeebb";
      drawPoly(ctx,
               e.x,
               e.y,
               [[-e.r, -e.r],
                [-e.r, e.r],
                [e.r, e.r],
                [e.r, -e.r]],
               e.h);
    },
    'ship': function(e, ctx, dx, dy){
      ctx.fillStyle="#eeaa22";
      if (e.thrust > 0){
      drawPoly(ctx,
               e.x,
               e.y,
               [[-13, -10],
                [-9, -10],
                [-9, 10],
                [-13, 10]],
               e.h);
      }
      if (e.scanning){
        ctx.fillStyle="#222222";
        ctx.lineStyle="#550099";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r*10, 0, 2*Math.PI);
        ctx.stroke();
      }
      ctx.fillStyle="#aaeebb";
      drawPoly(ctx,
               e.x,
               e.y,
               [[15, 0],
                [-10, -12],
                [-10, 12]],
               e.h);
    },
    'explosion': function(e, ctx, dx, dy){
      ctx.fillStyle="#FFA500";
      drawPoly(ctx,
               e.x,
               e.y,
               [[-130, -100],
                [-90, 100],
                [90, 100],
                [130, -100]],
               e.h);
    },
    'missile': function(e, ctx, dx, dy){
      ctx.fillStyle="#4411AA";
      drawPoly(ctx,
               e.x,
               e.y,
               [[10, -1],
                [-10, -2],
                [-10, 2],
                [10, 1]],
               e.h);
    }
  };

  function SpaceDisplay(id){
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
  }
  SpaceDisplay.prototype.render = function(entities, left, top, right, bottom){
    var onscreen = entities.slice();  // select elements in range
    this.ctx.fillStyle="#112233";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (var i=0; i<onscreen.length; i++){
      var entity = onscreen[i];
      entityDraw(entity, this.ctx, 0, 0, 1);
    }
  };

  function SpaceWorld(){
    this.entities = [];
  }
  SpaceWorld.prototype.addEntity = function(entity){
    this.entities.push(entity);
  };
  SpaceWorld.prototype.checkCollisions = function(){
    var collisions = [];
    for (var i=0; i<this.entities.length; i++){
      var e1 = this.entities[i];
      for (var j=i+1; j<this.entities.length; j++){
        var e2 = this.entities[j];
        if (e1.r !== undefined && e2 !== undefined &&
            dist(e1.x, e1.y, e2.x, e2.y) < e1.r + e2.r){
          collisions.push([i, j]);
        }
      }
    }
    for (var k=0; k<collisions.length; k++){
      this.entities[collisions[k][0]] = null;
      this.entities[collisions[k][1]] = null;
    }
    this.entities = this.entities.filter(function(x){return x !== null;});
  };
  SpaceWorld.prototype.findClosest = function(e1){
    var minDist = Number.MAX_VALUE;
    var other;
    for (var i=0; i<this.entities.length; i++){
      var e2 = this.entities[i];
      if (e1 === e2){ continue; }
      var d = dist(e1.x, e1.y, e2.x, e2.y);
      if (d < minDist){
        minDist = d;
        other = e2;
      }
    }
    return other;
  };
  SpaceWorld.prototype.distToClosest = function(e){
    var closest = this.findClosest(e);
    return dist(closest.x, closest.y, e.x, e.y);
  };
  SpaceWorld.prototype.tick = function(dt){
    for (var i=0; i<this.entities.length; i++){
      entityMove(this.entities[i], dt);
    }
    this.checkCollisions();
    for (var i=0; i<this.entities.length; i++){
      var e = this.entities[i];
      if (e.script !== undefined){
        runEntityScript(e);
      }
    }
  };

  SpaceWorld.prototype.deepCopyCreate = function(){
    return new SpaceWorld();
  };
  SpaceWorld.prototype.deepCopyPopulate = function(copy, memo, innerDeepCopy){
    copy.entities = innerDeepCopy(this.entities, memo);
  };


  var Space = {};
  Space.makeShip = makeShip;
  Space.makeBoid = makeBoid;
  Space.SpaceDisplay = SpaceDisplay;
  Space.SpaceWorld = SpaceWorld;
  Space.fireMissile = fireMissile;

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Space;
    }
  } else {
    window.Space = Space;
  }
})();
