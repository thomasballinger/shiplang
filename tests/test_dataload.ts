/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

import { loadData, parseLine } from '../dataload';

var simple = `
system Sol
	government Trader
	pos 0 0
	fleet "Triangle Patrol"
	object Earth
		color #004000
		radius 40
`

describe('data', () => {
    describe('parseLine', () => {
        it("should split on spaces and quotes", () => {
            assert.deepEqual(parseLine('Something "asf asdf" zxcv asf'),
                         ['Something', 'asf asdf', 'zxcv', 'asf']);
        });
    });
    describe('loadData', () => {
        it('should load data', () => {
            var data = loadData(simple);
            var expected = {
                system: {
                    'Sol': {
                        domain: 'system',
                        id: 'Sol',
                        government: ['Trader'],
                        pos: [ ['0', '0'] ],
                        fleet: ['Triangle Patrol'],
                        object: ['Earth']
                    }
                },
                object: {
                    'Earth': {domain: 'object',
                              id: 'Earth',
                              color: ['#004000'],
                              radius: ['40']
                    }
                }
            }
        console.log('---');
        console.log(data);
        console.log(expected);
        console.log('---');
        assert.deepEqual(data, expected);
        });
    });
});
