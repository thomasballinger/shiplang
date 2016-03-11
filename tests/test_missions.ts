/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

import { Mission, universe } from '../universe';

describe('Missions', () => {
    it("can be round-trip serialized", () => {
        var m = universe.missions['Gunner 1'];
        var data = m.save({a: 1});
        var reconstitutedData = JSON.parse(JSON.stringify(data));
        assert.deepEqual(data, reconstitutedData)
    });
});

