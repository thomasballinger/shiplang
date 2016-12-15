import { Entity } from './entity';
import { Gov } from './interfaces';
import { putMessage } from './messagelog';
import { getScriptByName } from './ai';

export enum EventType {
    Provoke,
    Kill,
    PlayerLand,
}

export class Event {
    constructor(public type: EventType,
                public actor: Entity,
                public target: Entity){}
    planet: string;
}

export class PlanetEvent extends Event {
    constructor(type: EventType, planet: string){
        super(type, undefined, undefined);
        this.planet = planet;
    }
}

export function killFiveAstroidsProcess(e: Event, data: any){
    if (e.type === EventType.Kill &&
        e.actor.government === Gov.Player &&
        e.target.government === Gov.Debris){
        data['killed'] += 1
    } else if (e.type === EventType.PlayerLand &&
               e.target){
    }
}
