[![Build Status](https://travis-ci.org/thomasballinger/shiplang.svg?branch=master)](https://travis-ci.org/thomasballinger/shiplang)

Currently using same assets as [Endless
Sky](https://github.com/endless-sky/endless-sky), a great game by Michael
Zahniser.

A somewhat recent version is usually up at
[missilecmd.ballingt.com/](http://missilecmd.ballingt.com/):

* [script editing](http://missilecmd.ballingt.com/?simulator)
* [early mission](http://missilecmd.ballingt.com/?gunner)

Zoom with Command and Alt/Option. Backslash moves the camera between entities
in simulator mode. M view the map in normal mode. Set window.debug = true for
uncapped frame rate and some other goodies.

Older versions:

* http://jan14prototype.ballingt.com/
* http://march8prototype.ballingt.com/


Headings are currently the unit circle backwards - should fix this.

+x is to the right
+y is down

flipping y in displays would fix the direction problem


Saved requirements aren't complete yet.

    npm run dev

to run

## Tests


    npm test

creates the build and runs all tests.

It may be useful to tests loaders separately if the build is failing:

    mocha nodetests

## Game Data

This project uses the assets from Endless Sky anda data format similar to
the one used in Endless Sky.

