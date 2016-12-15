/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

import { Profile } from '../src/profile';
import { Event } from '../src/mission';
import { Mission, universe } from '../src/universe';

describe('Profile', () => {
    it("can be round-trip serialized", () => {
        var simpleMission = new Mission()
        simpleMission.fleets = [];
        simpleMission.description = '';
        simpleMission.processEventMethod = function(e: Event, data: any){};
        simpleMission.id = 'SimpleMission';
        universe.missions['SimpleMission'] = simpleMission;

        //TODO crap method name
        var p = Profile.newProfile();

        p.script = '1 + 1';
        var l = [1, 2, 3];
        p.missions.push([simpleMission, {a: l}])
        p.set('name', 'Fred');
        var p2 = Profile.fromJson(p.toJson());
        assert.deepEqual(p.toJson(), p2.toJson());
        l.push(4);
        assert.notDeepEqual(p.toJson(), p2.toJson());
        delete universe.missions['SimpleMission'];
    });
});

