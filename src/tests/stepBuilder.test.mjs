import { StepBuilder } from '../step-builder.mjs';
import { ArgParser } from '../arg-parser.mjs'

describe('StepBuilder', () => {

    test('Suggests a direct mapping', () => {
        const argParser = new ArgParser('Given I have no parameters');
        const builder = new StepBuilder(argParser);

        const result = builder.getSuggestedStepMethod();

        expect(result).toBe(`    map(/I have no parameters$/i, (context) => {
            // Write your step code here
            throw new Error('Step not yet implemented');
            return context;
        });`);
    });

    test('Provides argument matchers', () => {
        const argParser = new ArgParser('Given I have "5" and "true" and "A string"');
        const builder = new StepBuilder(argParser);

        const result = builder.getSuggestedStepMethod();

        expect(result).toBe(`    map(/I have (\\"\\d+\\") and (\\"true\\"|\\"false\\") and "(.*)"$/i, (context, p0, p1, p2) => {
            // Write your step code here
            throw new Error('Step not yet implemented');
            return context;
        });`);
    });

    test('Handles relaxed syntax', () => {
        const argParser = new ArgParser('If I have no parameters');
        const builder = new StepBuilder(argParser);

        const result = builder.getSuggestedStepMethod();

        expect(result).toBe(`    map(/If I have no parameters$/i, (context) => {
            // Write your step code here
            throw new Error('Step not yet implemented');
            return context;
        });`);
    });
});