import { JestSpec } from '../index.mjs';
import * as ArgumentSteps from './steps/arguments.steps.mjs';

const spec = new JestSpec();
spec.addSteps(ArgumentSteps);

test('Argument steps', async () => {
    await spec.run('/src/specifications/ArgumentTypes.feature');
});