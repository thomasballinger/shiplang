/**
 * Orchestrates controls, updates to game engine, displays, etc.
 * Should change so that it can load engines from systems.
 *
 * Has a origWorld, an untouched original version of the current system
 */
import { Engine } from './engine';
import { Ship, Entity } from './entity';
import { InputHandler, Controls } from './manual';
import * as scriptEnv from './scriptenv';
import * as SLeval from './eval';
import { UserFunctionBodies } from './userfunctionbodies';
import { Profile } from './profile';
import { createObjects, Start, System, universe } from './universe';
var jsastdiff = require('./jsastdiff');

import { Updateable, Selection } from './interfaces';

export class Updater{
    constructor(public origWorld: Engine,
                public getCode: ()=>string, // gets updated code
                public doSnapshots=false,
                public keyHandlerId='', // where to set key handlers
                public setError=(msg: string)=>{},
                public clearError=()=>{},
                public queueWarning=(msg: string)=>{},
                public language='JavaScript',
                public onReset=()=>{},
                public highlight?: (id: string, selections: Selection[])=>void,
                public onChangeViewedEntity?: (e: Ship)=>void){

        var keyHandlerTarget: HTMLElement;
        if (keyHandlerId){
            var keyHandlerTarget = document.getElementById(keyHandlerId);
            if (!keyHandlerTarget){ throw Error("Key handler target not found: "+keyHandlerId); }
        }

        this.inputHandler = new InputHandler(keyHandlerTarget);
        this.origControls = new Controls(this.inputHandler, 0);
        this.observers = [];
        this.savedWorlds = [];
        this.codeHasChanged = false;
        this.userFunctionBodies = new UserFunctionBodies();
        this.paused = false;
    }
    world: Engine;
    lastValid: string;
    codeHasChanged: boolean;
    controls: Controls;
    origControls: Controls;
    inputHandler: InputHandler;
    observers: Updateable[];
    savedWorlds: Engine[];
    player: Ship;
    _viewedEntity: Ship;
    userFunctionBodies: UserFunctionBodies;
    paused: boolean;

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
        var seed = Math.random();
        var start = universe.starts[startName];
        Profile.clear()
        start.buildProfile().save()
        var system = start.system
        var world = new Engine(system, Profile.fromStorage());
        return world;
    }

    pause(){ this.paused = true; }
    unpause(){ this.paused = false; }

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
    // TODO It seems like it's required to call this to set up
    // updater the first time?
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
            (<any>window).updater = this;
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
            // save because it's syntactically valid
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
                    //console.log('restoring from game time', save[0].gameTime)
                    this.restartFromSave(save[0], save[1]);
                }
            }
            this.lastValid = s;
        }
    }

    reset(s?: string){
        if (s === undefined){ s = this.lastValid; }
        this.world = this.origWorld.copy()
        this.controls = this.origControls.copy();
        this.controls.activate() // make exclusive observer of this.inputHandler
        scriptEnv.setKeyControls(this.controls);

        this.world.addPlayer([s, this.userFunctionBodies, this.highlight]);
        this.player = this.world.getPlayer();
        this.viewedEntity = this.player;
        this.onReset()
        this.debugData();
        scriptEnv.setProfile(Profile.fromStorage())
    }
    restartFromSave(world: Engine, controls: Controls){
        this.controls = controls.copy();
        this.controls.activate();
        scriptEnv.setKeyControls(this.controls);
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
            } else if (this.language.toLowerCase() === 'javascript'){
                this.loadJS();
            } else {
                throw Error("don't know language "+this.language)
            }
            this.codeHasChanged = false;
        }
        if (this.doSnapshots){
            var preTickSnapshot: [Engine, Controls] = [
                this.world.copy(), this.controls.copy()];
        }
        var world = this.world;
        var viewedEntity = this.viewedEntity;

        // This includes:
        // * warping in new fleets
        // * moving everything
        // * collision detection
        // * ai for each entity (including creating and running projectile ai)
        //console.log('starting engine tick');
        world.tick(dt, this.setError);
        //console.log('ending engine tick');
        //world.tick(dt, function(e){ throw e; });
        this.ensureView()

        if (updateDisplays){
            this.observers.map(function(obs){
                obs.update(viewedEntity, world);
            })
        }

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
            //console.log('snapshot controls has pressed:', preTickSnapshot[1].pressed);
            this.userFunctionBodies.save(preTickSnapshot[0], preTickSnapshot[1]);
        }

        // just in case this is the first tick after a rewind tick,
        // reset pressed keys to match currently pressed keys
        // (during that first tick they match restored state)
        // TODO only do this right after a rewind tick somehow
        this.controls.updateFromInputHandler();

        var tickTime = new Date().getTime() - tickStartTime;
        return tickTime
    }
}
