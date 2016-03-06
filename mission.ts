import { Entity } from './entity';
import { Gov } from './interfaces';

// Events exist only within a tick and therefore don't
// need to be serializable. They can reference entities
// without leaking memory.

interface moduleOfMissions {
    [key: string]: MissionStatic;
}

export enum EventType {
    Provoke,
    Kill,
}

export class Event {
    constructor(public type: EventType,
                public actor: Entity,
                public target: Entity){}
}

export interface MissionStatic {
    new(data?: any): Mission;
}

export abstract class Mission {
    /** Return value should be JSON serializable */
    constructor(data?: any){
        if (data === undefined){
            this.initializeData();
        } else {
            this.load(data);
        }
    }
    save(): [string, any]{
        return [this.constructor.name, this.data];
    }
    /** could be overriden to do some validation */
    load(data: any){
        this.data = data;
    };
    static fromNameAndData(name: string, data: any): Mission{
        return new (<moduleOfMissions><any>missions)[name](data);
    }
    data: any;
    abstract processEvent(e: Event): void;
    /** reasonable to have an implementation that does nothing */
    initializeData(){}
}

/** Loads current mission from saved data */
export function loadMissions(missionsData: [string, any][]){
    return missionsData.map(function(x){ return Mission.fromNameAndData(x[0], x[1]); })
}

export var missions = <moduleOfMissions>{
    'KillFiveAstroidsMission': class KillFiveAstroidsMission extends Mission {
        initializeData(){
            this.data = {killed: 0};
        }
        processEvent(e: Event){
            if (e.type === EventType.Kill &&
                e.actor.government === Gov.Player &&
                e.target.government === Gov.Debris){
                this.data['killed'] += 1
            }
        }
    },
    'DontAttackCiviliansMission': class DontAttackCiviliansMission extends Mission {
        initializeData(){
            this.data = {killed: 0}
        }
        processEvent(e: Event){
            if (e.type === EventType.Provoke &&
                e.actor.government === Gov.Player &&
                e.target.government === Gov.Trader){
                //TODO clean up civilian -> civilian or something
                this.data['killed'] += 1
            }
        }
    }
}

