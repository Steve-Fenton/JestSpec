import { JestSpec } from '../index.mjs';
import * as CalculatorSteps from './steps/calculator.steps.mjs';

const spec = new JestSpec();
spec.addSteps(CalculatorSteps);

const sampleSpecification = `Feature: Basic Working Example
    In order to avoid silly mistakes
    As a math idiot
    I want to be told the sum of two numbers

Scenario: Basic Example with Calculator
    Given I am using a calculator
    And I enter 50 into the calculator
    And I enter 70 into the calculator
    When I press the total button
    Then the result should be 120 on the screen

Scenario Outline: Basic Example with Table
    Given I am using a calculator
    And I enter <Number 1> into the calculator
    And I enter <Number 2> into the calculator
    When I press the total button
    Then the result should be <Total> on the screen

Examples:
    | Number 1 | Number 2 | Total |
    |----------|----------|-------|
    | 1        | 1        | 2     |
    | 1        | 2        | 3     |
    | 2        | 3        | 5     |
    | 8        | 3        | 11    |
    | 9        | 8        | 17    |
`;

describe('Parser', () => {

    test('Gets the summary of the feature', async () => {
        const summary = spec.getSummary(sampleSpecification);

        expect(summary.feature).toBe('Basic Working Example');

        expect(summary.scenarios[0].name).toBe('Basic Example with Calculator');
        expect(summary.scenarios[0].line).toBe(5);
        
        expect(summary.scenarios[1].name).toBe('Basic Example with Table');
        expect(summary.scenarios[1].line).toBe(12);

        expect(summary.scenarios.length).toBe(2);
    });

    test('Populates the summary with steps', async () => {
        const step1 = spec.getSummary(sampleSpecification);
        const summary = spec.assignSteps(step1);

        expect(summary.scenarios[0].steps[0]).toBe('Given I am using a calculator');
        expect(summary.scenarios[0].steps[1]).toBe('And I enter 50 into the calculator');
        expect(summary.scenarios[0].steps[2]).toBe('And I enter 70 into the calculator');
        expect(summary.scenarios[0].steps[3]).toBe('When I press the total button');
        expect(summary.scenarios[0].steps[4]).toBe('Then the result should be 120 on the screen');
        
        expect(summary.scenarios[1].steps[0]).toBe('Given I am using a calculator');
        expect(summary.scenarios[1].steps[1]).toBe('And I enter <Number 1> into the calculator');
        expect(summary.scenarios[1].steps[2]).toBe('And I enter <Number 2> into the calculator');
        expect(summary.scenarios[1].steps[3]).toBe('When I press the total button');
        expect(summary.scenarios[1].steps[4]).toBe('Then the result should be <Total> on the screen');
        expect(summary.scenarios[1].steps[5]).toBe('Examples:');
        expect(summary.scenarios[1].steps[6]).toBe('| Number 1 | Number 2 | Total |');
        expect(summary.scenarios[1].steps[7]).toBe('| 1        | 1        | 2     |');
        expect(summary.scenarios[1].steps[8]).toBe('| 1        | 2        | 3     |');
        expect(summary.scenarios[1].steps[9]).toBe('| 2        | 3        | 5     |');
        expect(summary.scenarios[1].steps[10]).toBe('| 8        | 3        | 11    |');
        expect(summary.scenarios[1].steps[11]).toBe('| 9        | 8        | 17    |');

        expect(summary.scenarios.length).toBe(2);
    });

    test('Expands the summary examples into scenarios', async () => {
        const step1 = spec.getSummary(sampleSpecification);
        const step2 = spec.assignSteps(step1);
        const summary = spec.extractExamples(step2)

        expect(summary.scenarios[0].steps[0]).toBe('Given I am using a calculator');
        expect(summary.scenarios[0].steps[1]).toBe('And I enter 50 into the calculator');
        expect(summary.scenarios[0].steps[2]).toBe('And I enter 70 into the calculator');
        expect(summary.scenarios[0].steps[3]).toBe('When I press the total button');
        expect(summary.scenarios[0].steps[4]).toBe('Then the result should be 120 on the screen');
        
        expect(summary.scenarios[1].steps[0]).toBe('Given I am using a calculator');
        expect(summary.scenarios[1].steps[1]).toBe('And I enter 1 into the calculator');
        expect(summary.scenarios[1].steps[2]).toBe('And I enter 1 into the calculator');
        expect(summary.scenarios[1].steps[3]).toBe('When I press the total button');
        expect(summary.scenarios[1].steps[4]).toBe('Then the result should be 2 on the screen');

        expect(summary.scenarios[2].steps[0]).toBe('Given I am using a calculator');
        expect(summary.scenarios[2].steps[1]).toBe('And I enter 1 into the calculator');
        expect(summary.scenarios[2].steps[2]).toBe('And I enter 2 into the calculator');
        expect(summary.scenarios[2].steps[3]).toBe('When I press the total button');
        expect(summary.scenarios[2].steps[4]).toBe('Then the result should be 3 on the screen');

        expect(summary.scenarios[3].steps[0]).toBe('Given I am using a calculator');
        expect(summary.scenarios[3].steps[1]).toBe('And I enter 2 into the calculator');
        expect(summary.scenarios[3].steps[2]).toBe('And I enter 3 into the calculator');
        expect(summary.scenarios[3].steps[3]).toBe('When I press the total button');
        expect(summary.scenarios[3].steps[4]).toBe('Then the result should be 5 on the screen');

        expect(summary.scenarios[4].steps[0]).toBe('Given I am using a calculator');
        expect(summary.scenarios[4].steps[1]).toBe('And I enter 8 into the calculator');
        expect(summary.scenarios[4].steps[2]).toBe('And I enter 3 into the calculator');
        expect(summary.scenarios[4].steps[3]).toBe('When I press the total button');
        expect(summary.scenarios[4].steps[4]).toBe('Then the result should be 11 on the screen');

        expect(summary.scenarios[5].steps[0]).toBe('Given I am using a calculator');
        expect(summary.scenarios[5].steps[1]).toBe('And I enter 9 into the calculator');
        expect(summary.scenarios[5].steps[2]).toBe('And I enter 8 into the calculator');
        expect(summary.scenarios[5].steps[3]).toBe('When I press the total button');
        expect(summary.scenarios[5].steps[4]).toBe('Then the result should be 17 on the screen');

        expect(summary.scenarios.length).toBe(6);
    });

});