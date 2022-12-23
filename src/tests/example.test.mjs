import fs from 'fs';
import path from 'path';
import { JestSpec } from '../index.mjs';
import * as CalculatorSteps from './steps/calculator.steps.mjs';

// TODO: work out argument type, and parse them, based on the regex
// i.e. (\d+) should pass a number as the argument, not a string

// This stuff sets up the specification to test...
// TODO: Make this super simple

const spec = new JestSpec();

spec.addSteps(CalculatorSteps);

const featurePath = path.join(process.cwd(), '/src/specifications/Basic.feature');
const feature = fs.readFileSync(featurePath, {encoding:'utf8', flag:'r'});

const tests = await spec.parse(feature);

// Here's the binding to Jest
// TODO: Make this less code-y

test('Test', async () => {
    for (const x of tests) {
        console.log('Running Scenario', x.feature, x.scenario, x.steps.length);
        let context = {
            feature: x.feature,
            scenario: x.scenario
        };
        for (const s of x.steps) {
            s.args[0] = context;
            console.log('Running step', s.name);
            context = await s.func.apply(null, s.args);
        }
    }
});

// test('All specs', () => {
//     for (const x of tests) {
//         const context = {};
//         for (const s of x.steps) {
//             s.args[0] = context;
//             s.func(s.args);
//         }
//     }
// });

/**
 * Theory option 2 - we could have a command npm spec that takes the
 * specifications and creates a jest file in /.jest/feature.test.js
 * before calling npm test
 */
