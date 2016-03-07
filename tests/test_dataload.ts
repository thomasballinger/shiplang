/// <reference path="../typings/mocha/mocha.d.ts" />
import { assert } from 'chai';

import { loadData, parseLine } from '../dataload';
import { createObjects } from '../system';

var real = require('raw!../data/map.txt');

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
        it('should load data accurately', () => {
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
            assert.deepEqual(data, expected);
        });
        it('should load real data', () => {
            console.log(loadData(real));
        });
    });
});

describe('data objects', () => {
    it('should create objects from full data', () => {
        var data = loadData(real)
        console.log(data);
        console.log(createObjects(data));
    })
})
