import { Gov } from './interfaces';
import { Entity, Ship } from './entity';
import { Event, EventType } from './mission';
import { Profile } from './profile';


export function isEnemy(e1: Entity, e2: Entity){
    if (e1.government === Gov.Player){
        //TODO make this a reputation-based check
        return (e2.government === Gov.Pirate || e2.government === Gov.Debris);
    } else if (e1.government === Gov.Pirate){
        return e2.government !== Gov.Pirate;
    } else if (e1.government === Gov.Cleanup){
        return e2.government === Gov.Debris;
    } else {
        return e2.government === Gov.Pirate;
    }
}

export function govModReputation(e: Event, p: Profile){
    if (e.type === EventType.Kill){
        p.reputation[e.target.government] -= 1;
        console.log(Gov[e.actor.government], 'hit', Gov[e.target.government]);
    }
}
