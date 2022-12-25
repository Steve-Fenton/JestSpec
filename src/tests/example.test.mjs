import { JestSpec } from '../index.mjs';
import * as CalculatorSteps from './steps/calculator.steps.mjs';

const spec = new JestSpec();
spec.addSteps(CalculatorSteps);

test('Basic feature test', async () => {
    await spec.run('/src/specifications/Basic.feature');
});

test('Missing step test', async() => {
    await spec.run('/src/specifications/MissingStep.feature');
});