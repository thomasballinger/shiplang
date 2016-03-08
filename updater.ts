/**
 * Orchestrates controls, updates to game engine, displays, etc.
 * Should change so that it can load engines from systems.
 *
 * Has a origWorld, an untouched original version of the current system
 */
import { Engine } from './engine';
import { Ship, Entity } from './entity';
var manual = require('./manual');
import * as scriptEnv from './scriptenv';
import * as SLeval from './eval';
import { UserFunctionBodies } from './userfunctionbodies';
import { Profile } from './profile';
import { createObjects, Start, System } from './universe';
import { loadData } from './dataload';
var jsastdiff = require('./jsastdiff');

import { Updateable, Selection } from './interfaces';

var gamedata = loadData(require('raw!./data/map.txt'));

export class Updater{
    constructor(public setError: (msg: string)=>void,
                public clearError: ()=>void,
                public queueWarning: (msg: string)=>void,
                public getCode: ()=>string, // gets updated code
                public keyHandlerId: string, // where to set key handlers
                public origWorld: Engine,
                public language: string,
                public onReset?: ()=>void,
                public highlight?: (id: string, selections: Selection[])=>void,
                public doSnapshots?: boolean,
                public onChangeViewedEntity?: (e: Ship)=>void){

        var keyHandlerTarget = document.getElementById(keyHandlerId);
        this.controls = new manual.Controls(keyHandlerTarget, 0); //TODO
        scriptEnv.setKeyControls(this.controls);
        this.observers = [];
        this.savedWorlds = [];
        this.codeHasChanged = false;
        this.userFunctionBodies = new UserFunctionBodies();
    }
    world: Engine;
    lastValid: string;
    codeHasChanged: boolean;
    controls: any;
    observers: Updateable[];
    savedWorlds: Engine[];
    player: Ship;
    _viewedEntity: Ship;
    userFunctionBodies: UserFunctionBodies;

    get viewedEntity(): Ship{
        return this._viewedEntity;
    }
    set viewedEntity(value: Ship){
        if (this.onChangeViewedEntity) {
            this.onChangeViewedEntity(value);
        }
        this._viewedEntity = value;
    }

    getWorld(startName: string): Engine{
        var universe = createObjects(gamedata);
        var seed = Math.random();
        var start = universe.starts[startName];
        Profile.clear()
        start.buildProfile().save()
        var system = start.system
        var world = new Engine(system, Profile.fromStorage());
        return world;
    }

    toggleView(){
        var viewable = this.world.entities.filter(function(x){ return x.viewable })
        var currentIndex = viewable.indexOf(this.viewedEntity);
        if (currentIndex === -1){
            this.ensureView()
        }
        this.viewedEntity = <Ship>(viewable[(currentIndex + 1) % viewable.length]);
    }
    // if currently viewed entity doesn't exist, use the player instead;
    ensureView(){
        var viewable = this.world.entities.filter(function(x){ return x.viewable })
        if (viewable.indexOf(this.viewedEntity) === -1){
            this.viewedEntity = this.player;
        }
    }

    // objects to call .update() on ever tick
    registerObserver(obj: Updateable){
        this.observers.push(obj);
    }

    // called when the editor has new state (it might not actually
    // be different, Updater will check)
    notifyOfCodeChange(){
        this.codeHasChanged = true;
    }

    loadSL(){
        var s = this.getCode();
        var c = SLeval.parseOrShowError(s, this.setError);
        if (c !== undefined){
            this.clearError();
            try {
                var userScripts = scriptEnv.SLgetScripts(s);
            } catch (e) {
                this.setError(e.message);
                var userScripts = undefined;
            }
            if (userScripts){
                this.lastValid = s;
                this.world = this.origWorld.copy();
                this.world.addPlayer(this.lastValid);
                this.player = this.world.getPlayer();
                this.viewedEntity = this.player;
            }
        }
    }

    debugData(){
        if ((<any>window).DEBUGMODE){
            (<any>window).world = this.world;
            (<any>window).player = this.player;
        }
    }

    loadJS(){
        var s = this.getCode();
        try {
            var newAST = (<any>window).acorn.parse(s);
            this.clearError();
        } catch (e) {
            this.setError(e);
            s = undefined;
        };
        if (s){
            Profile.fromStorage().set('script', s);
            var changed = jsastdiff.changedNamedFunctions(
                (<any>window).acorn.parse(this.lastValid), newAST);
            if (changed.hasOwnProperty('*main*')){
                // start over totally, top level change
                this.userFunctionBodies.reset();
                this.reset(s);
            } else if (Object.keys(changed).length === 0) {
                //console.log('no function asts changed');
            } else {
                for (var name of Object.keys(changed)){
                    //console.log('saving body for', name, changed[name])
                    this.userFunctionBodies.saveBody(name, changed[name]);
                }
                var save = this.userFunctionBodies.getEarliestSave(Object.keys(changed));
                if (save === undefined){
                    // NOP because the modified functions have never been called
                    //console.log('not restoring because modified function never called');
                } else if (save === null) {
                    // Start over because modified functions have never been *defined*
                    //console.log('starting over, function not yet defined');
                    this.userFunctionBodies.reset();
                    this.reset(s)
                } else {
                    //console.log('restoring from game time', save.gameTime)
                    this.restartFromSave(save);
                }
            }
            this.lastValid = s;
        }
    }

    reset(s?: string){
        if (s === undefined){ s = this.lastValid; }
        this.world = this.origWorld.copy()
        this.world.addPlayer([s, this.userFunctionBodies, this.highlight]);
        this.player = this.world.getPlayer();
        this.viewedEntity = this.player;
        this.onReset()
        this.debugData();
        scriptEnv.setProfile(Profile.fromStorage())
    }
    restartFromSave(world: Engine){
        this.world = world;
        this.player = this.world.getPlayer();
        this.viewedEntity = this.player;
        this.onReset();
        this.debugData();
        scriptEnv.setProfile(world.profile)
    }

    // please advance world state one tick and update displays
    tick(dt: number, updateDisplays=true):number{
        var tickStartTime = new Date().getTime();

        if (this.codeHasChanged){
            if (this.language.toLowerCase() === 'shiplang'){
                this.loadSL();
            } else if (this.language.toLowerCase() == 'javascript'){
                this.loadJS();
            } else {
                throw Error("don't know language "+this.language)
            }
            this.codeHasChanged = false;
        }
        if (this.doSnapshots){
            var preTickSnapshot = this.world.copy();
        }
        var world = this.world;
        var viewedEntity = this.viewedEntity;
        world.tick(dt, this.setError);
        //world.tick(dt, function(e){ throw e; });
        this.ensureView()

        if (updateDisplays){
            this.observers.map(function(obs){
                obs.update(viewedEntity, world);
            })
        }

        //TODO factor out reset behavior
        if (this.player.dead){
            this.reset();
        }
        /*
        this.savedWorlds.push(this.world.copy());
        if (this.savedWorlds.length > 100){
            this.savedWorlds.shift();
        }
        */
       if (this.doSnapshots){
            this.userFunctionBodies.save(preTickSnapshot);
       }

        var tickTime = new Date().getTime() - tickStartTime;
        return tickTime
    }
}
