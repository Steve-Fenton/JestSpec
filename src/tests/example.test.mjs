import { JestSpec } from '../index.mjs';
import * as CalculatorSteps from './steps/calculator.steps.mjs';
import * as ArgumentSteps from './steps/arguments.steps.mjs';

const spec = new JestSpec(); // Add JestSpec("true") for verbose logging
spec.addSteps(CalculatorSteps);
spec.addSteps(ArgumentSteps);

test('Async steps', async () => {
    await spec.run('/src/specifications/AsyncSteps.feature');
});

test('Argument steps', async () => {
    await spec.run('/src/specifications/ArgumentTypes.feature');
});

test('Basic features', async () => {
    await spec.run('/src/specifications/Basic.feature');
});

test('Multiple arguments per line', async () => {
    await spec.run('/src/specifications/MultipleArgumentsPerLine.feature');
});

test('Multiple scenarios', async () => {
    await spec.run('/src/specifications/MultipleScenarios.feature');
});

test('Quoted strings', async () => {
    await spec.run('/src/specifications/QuotedStrings.feature');
});

test('Scenario outlines', async () => {
    await spec.run('/src/specifications/ScenarioOutlines.feature');
});

// MixedSpecificationFiles.feature

test.skip('Failing test', async() => {
    await spec.run('/src/specifications/Failing.feature');
});

test.skip('Missing step test', async() => {
    await spec.run('/src/specifications/MissingStep.feature');
});