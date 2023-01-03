import { JestSpec } from '../../index.mjs';
import * as CalculatorSteps from './steps/calculator.steps.mjs';

const spec = new JestSpec(); // Add JestSpec("true") for verbose logging
spec.addSteps(CalculatorSteps);

test('Async steps should work', async () => {
    await spec.run('/src/specifications/AsyncSteps.feature');
});

test('A basic specification', async () => {
    await spec.run('/src/specifications/Basic.feature');
});

test('A specifications with steps that contain multiple arguments', async () => {
    await spec.run('/src/specifications/MultipleArgumentsPerLine.feature');
});

test('A specification containing multiple scenarios', async () => {
    await spec.run('/src/specifications/MultipleScenarios.feature');
});

test('A specification with arguments enclosed in quotes', async () => {
    await spec.run('/src/specifications/QuotedStrings.feature');
});

test('A specification containing a scenario outline and table of examples', async () => {
    await spec.run('/src/specifications/ScenarioOutlines.feature');
});

test('A specification with multiple scenarios of different types', async () => {
    await spec.run('/src/specifications/MixedSpecificationFiles.feature');
});