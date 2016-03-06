/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

import { Profile } from '../profile';
import { Mission, MissionStatic, missions, Event } from '../mission';

class SimpleMission extends Mission{
    processEvent(e: Event): void{}
}

describe('Profile', () => {
    it("can be round-trip serialized", () => {
        (<any>missions).SimpleMission = SimpleMission;

        //TODO crap method name
        var p = Profile.newProfile();

        p.script = '1 + 1';
        var l = [1, 2, 3];
        p.addMission(new SimpleMission({a: l}));
        p.set('name', 'Fred');
        var p2 = Profile.fromJson(p.toJson());
        assert.deepEqual(p.toJson(), p2.toJson());
        l.push(4);
        assert.notDeepEqual(p.toJson(), p2.toJson());
        delete (<any>missions).SimpleMission;
    });
});
