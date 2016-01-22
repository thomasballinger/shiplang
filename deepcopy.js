// Copy!
// I'm using the names Oran Looney does in
// http://www.oranlooney.com/deep-copy-javascript/
//
// When we save state we should clear render instructions? Nah, why bother.

;(function() {
  'use strict';

  var _numObjects = 0;
  function objectId(obj) {
    if (typeof obj !== 'object' || obj === null){
      throw Error("objectId called on a non-object or null: "+obj);
    }
    if (obj.__obj_id === undefined){
      objectId.thingsWithIds.push(obj);
      obj.__obj_id = _numObjects++;
    }
    return obj.__obj_id;
  }

  objectId.thingsWithIds = [];
  objectId.deleteIds = function(){
    for (var i = 0; i < objectId.thingsWithIds.length; i++){
      delete objectId.thingsWithIds[i].__obj_id;
    }
    objectId.thingsWithIds = [];
  };

  var passthroughCopier = {
    name: 'Passthrough',
    canCopy: function(obj){
      return (obj === null ||
        typeof obj === 'boolean' ||
        typeof obj === 'undefined' ||
        typeof obj === 'undefined' ||
        typeof obj === 'number' ||
        typeof obj === 'string' ||
        typeof obj === 'function');
    },
    create: function(obj){ return obj; },
    populate: function(obj){ return; }
  };

  var copiers = {
    'Array': {
      canCopy: function(obj){ return Array.isArray(obj); },
      create: function(obj){ return []; },
      populate: function(obj, copy, memo){
        for (var i = 0; i < obj.length; i++){
          copy.push(innerDeepCopy(obj[i], memo));
        }
      }
    },
    'Object': {
      canCopy: function(obj){ return obj.constructor === Object; },
      create: function(obj){ return {}; },
      populate: function(obj, copy, memo){
        for (var property in obj){
          if (obj.hasOwnProperty(property)){
            if (property == '__obj_id'){
              // nop
            } else {
              copy[property] = innerDeepCopy(obj[property], memo);
            }
          }
        }
      }
    },
  };

  function isDOM(obj){
    return obj.nodeType > 0;
  }
  function isBrowser(obj){
    return (obj === window ||
            obj === console);
  }

  function innerDeepCopy(x, memo){
    if (memo === undefined){
      throw Error("Need to pass second argument to deepCopy");
    }
    if (passthroughCopier.canCopy(x)){ return x; }
    if (isDOM(x) || isBrowser(x)) { return x; }
    if (x.__deepCopyPassthrough){ return x; }


    var id = objectId(x);
    var copy = memo[id];
    if (copy !== undefined){
      return copy;
    }

    var copied = false;
    for (var name in copiers){
      var copier = copiers[name];
      if (!copier.canCopy(x)){ continue; }
      copy = copier.create(x);
      memo[id] = copy;
      copier.populate(x, copy, memo);
      copied = true;
      break;
    }
    if (copied){ return copy; }
    if (x.deepCopyCreate !== undefined && x.deepCopyPopulate !== undefined){
      copy = x.deepCopyCreate(x);
      memo[id] = copy;
      x.deepCopyPopulate(copy, memo, innerDeepCopy);
      return copy;
    }
    if (x.deepCopyCreate !== undefined){
      // use default populate method
      copy = x.deepCopyCreate(x);
      for (var property in x){
        if (x.hasOwnProperty(property)){
          if (property == '__obj_id'){
            // nop
          } else {
            copy[property] = innerDeepCopy(x[property], memo);
          }
        }
      }
      return copy;
    }
    throw Error("Can't deep copy "+typeof x + " " + x.constructor + " "+x);
  }

  function deepCopy(x){
    var memo = {};
    var copy = innerDeepCopy(x, memo);
    //objectId.deleteIds(); // commenting out results in speedup in dal segno project
    return copy;
  }

  deepCopy.innerDeepCopy = innerDeepCopy;
  deepCopy.copiers = copiers;

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = deepCopy;
    }
  } else {
    window.deepCopy = deepCopy;
  }
})();
