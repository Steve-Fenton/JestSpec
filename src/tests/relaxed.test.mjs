import { JestSpec } from '../../index.mjs';
import * as RelaxedSteps from './steps/relaxed.steps.mjs';

const spec = new JestSpec();
spec.addSteps(RelaxedSteps);

test('Relaxed feature', async () => {
    await spec.run('/src/specifications/Relaxed.feature');
});