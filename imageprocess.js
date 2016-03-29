var fs = require('fs');
var PNG = require('node-png').PNG;

function displayGrid(grid, path){
  path = path || [];
  var hash = {};
  for (var spot of path){
    hash[''+spot[0]+'x'+spot[1]] = true;
  }
  var output = '';
  var y = -1;
  for (var row of grid){
    y++;
    x = -1;
    var line = '';
    for (var entry of row){
      x++;
      if (hash[''+x+'x'+y]){
        line += '+';
      } else {
        line += entry ? 'X' : ' ';
      }
    }
    console.log(line);
  }
}

/** build a boolean grid with JS arrays */
function buildGrid(png){
  var grid = [];
  for (var y = 0; y < png.height; y++) {
    var row = [];
    for (var x = 0; x < png.width; x++) {
      var idx = (png.width * y + x) << 2;
      // and reduce opacity
      row.push(png.data[idx+3] !== 0);
    }
    grid.push(row);
  }
  return grid;
}

function findOutline(filename, cb){
  fs.createReadStream(filename)
  .pipe(new PNG({
    filterType: 4 // means use all pixels
  }))
  .on('parsed', function() {
    var grid = buildGrid(this);
    var path = traverse(grid);
    //displayGrid(grid, path);
    cb(grid);
  });
}

/** Returns the next filled pixel left to right, top to bottom */
function nextFilled(grid, xi, yi){
  xi = xi || 0;
  yi = yi || 0;
  if (xi >= grid[0].length){
    yi += 1;
    xi = 0;
  }
  for (var y=yi; y < grid.length; y++){
    for (var x=xi; x < grid[0].length; x++){
      if (grid[y][x]){
        return [x, y];
      }
    }
  }
  throw Error("Couldn't find a marked pixel");
}

function neighboring(x, y, grid){
  var n = [[x+1, y], [x, y+1], [x-1, y], [x, y-1]].filter(function(spot){
    return !(spot[0] < 0 || spot[1] < 0 || spot[0] >= grid[0].length || spot[1] >= grid.length)
  });
  return n;
}

/** return the two pixels locations beyond the on and off pixels */
function ahead(on, off){
  var direction;
  if (off[0] === on[0] + 1){
    direction = [0, 1];
  } else if (off[0] === on[0] - 1){
    direction = [0, -1];
  } else if (off[1] + 1 === on[1]){
    direction = [1, 0];
  } else if (off[1] === on[1] + 1){
    direction = [-1, 0];
  } else {
    throw Error('bad on and off values:'+on+off);
  }

  var aheadLeft = [off[0] + direction[0], off[1] + direction[1]];
  var aheadRight = [on[0] + direction[0], on[1] + direction[1]];

  return [aheadLeft, aheadRight];
}

function march(on, off, grid){
// March clockwise around the image with "on" on the right,
// "off" on the left. Collect "on" points.

  var path = [on];
  while(true){
    var a = ahead(on, off);
    var AL = a[0];
    var AR = a[1];

    var ALval = grid[AL[1]][AL[0]];
    var ARval = grid[AR[1]][AR[0]];

    // if both on, turn left
    if (ALval && ARval){
      on = AL;

    // if left off and right on, go forward
    } else if (!ALval && ARval){
      off = AL;
      on = AR;

    // if both off, turn right
    } else if (!ALval && !ARval){
      off = AR;

    // if left on and right off, bleh; turn right anyway
    } else if (ALval && !ARval){
      off = AR;

    } else { throw Error("I thought that was exhaustive..."); }

    // > 3 is a hack to prevent turning at the first pixel
    // from making the path seem closed
    if (path.length > 3 && path[0][0] === on[0] && path[0][1] === on[1]){
      break;
    }

    path.push(on);
  }
  return path;
}

function traverse(grid){
  //TODO pad instead of zeroing layer of edge pixels on all sides
  //to deal with images that brush up against the side.
  //for now though just zeroing:
  for (var y=0; y<grid.length; y++){
    for (var x=0; x<grid[0].length; x++){
      if (x === 0 || y === 0 || x === grid[0].length-1 || y === grid.length-1){
        grid[y][x] = false; } } }


  // find first filled pixel
  var x = 0;
  var y = 0;
  var offNeighbors;
  while (true){
    var spot = nextFilled(grid, x, y);
    x = spot[0];
    y = spot[1];
    offNeighbors = neighboring(x, y, grid).filter(function(spot){
      return !grid[spot[1]][spot[0]];
    });
    if (offNeighbors.length > 0){
      break;
    }
    x += 1;
  }
  var on = [x, y];
  var off = offNeighbors[0];

  if (grid[on[1]][on[0]] !== true || grid[off[1]][off[0]] !== false){
    throw Error("Something bad happened...");
  }

  var path = march(on, off, grid);
  //displayGrid(grid, path);
  //displayGrid(grid, simplifyCycle(path));

  //TODO temp hack: take every fiftieth point
  return simplifyCycle(path, 50);
}

/** Hacky temp simplifying of line */
function simplifyCycle(path, every){
  var every = every || 50;
  var newPath = [];
  for (var i=0; i<path.length; i+=every){
    newPath.push(path[i]);
  }
  return newPath;
}

/** Returns the distance from a point to a line */
function distFromLine(l1, l2, p){
  //TODO
}

/** Find the point furthest from the line */
function worsePoint(path, p1, p2){
  //TODO
}

// Ramer–Douglas–Peucker algorithm
/** Simplifies a path */
function RDP(path, epsilon){
  // Over entire line, find the point most out of place.
  // Add that point to the path.
  // Do this recursively.

  //TODO
}

function cyclicRDP(path, epsilon){
  //TODO
}

module.exports.findOutline = findOutline;
module.exports.RDP = RDP;
module.exports.distFromLine = distFromLine;
