import { JestSpec } from '../index.mjs';
import * as CalculatorSteps from './steps/calculator.steps.mjs';

const spec = new JestSpec(); // Add JestSpec("true") for verbose logging
spec.addSteps(CalculatorSteps);

describe.skip('Intentional failures', () => {

    test('A deliberately failing test', async() => {
        await spec.run('/src/specifications/Failing.feature');
    });

    test('A demonstration of missing steps', async() => {
        await spec.run('/src/specifications/MissingStep.feature');
    });

});