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

test('Multiple scenarios', async () => {
    await spec.run('/src/specifications/MultipleScenarios.feature');
});

// 
// 
// ExcludedByTag.feature <--  should use Jest's own feature
// Failing.feature
// FailingAsyncSteps.feature
// MixedSpecificationFIles.feature
// MultipleArgumentsPerLine.feature
// QuotedStrings.feature
// ScenarioOutlines.feature
// UnquotedExpressions.feature

test.skip('Missing step test', async() => {
    await spec.run('/src/specifications/MissingStep.feature');
});