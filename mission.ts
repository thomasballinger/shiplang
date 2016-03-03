import { Ship } from './entity';
import * as missions from './missions';

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
                public actor: Ship,
                public target: Ship){}
}

export interface MissionStatic {
    new(data?: any): Mission;
}

export abstract class Mission {
    /** Return value should be JSON serializable */
    constuctor(data?: any){
        if (data === undefined){
            this.initializeData();
        } else {
            this.load(data);
        }
    }
    save(): [string, any]{
        return [this.constructor.toString(), this.data];
    }
    /** could be overriden to do some validation */
    load(data: any){
        this.data = data;
    };
    data: any;
    abstract processEvent(e: Event): void;
    /** reasonable to have an implementation that does nothing */
    initializeData(){}
}

/** Loads current mission from saved data */
function loadMission(name: string, data: any): Mission{
    return new (<moduleOfMissions><any>missions)[name](data);
}

export function loadMissions(missionsData: [string, any][]){
    return missionsData.map(function(x){ return loadMission(x[0], x[1]); })
}
