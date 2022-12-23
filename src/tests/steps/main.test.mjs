import { JestSpec } from '../../index.mjs';

const spec = new JestSpec();

spec.addSteps([
    '**/*.step.js',
    '**/*.step.mjs'
]);

spec.addFeatures([
    '**/*.feature'
]);

const tests = await spec.run();

/**
 * Option one... run all the specs in one discoverable Jest
 */
test('All specs', () => {
    for (const x of tests) {
        const context = {};
        for (const s of x.steps) {
            s.args[0] = context;
            s.func(s.args);
        }
    }
});

/**
 * Theory option 2 - we could have a command npm spec that takes the
 * specifications and creates a jest file in /.jest/feature.test.js
 * before calling npm test
 */

