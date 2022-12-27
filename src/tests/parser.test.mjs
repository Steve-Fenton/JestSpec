import { SpecParser } from '../spec-parser.mjs';

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

    test('Converts the text feature into a structured feature', () => {
        const parser = new SpecParser();
        const feature = parser.parse(sampleSpecification);

        expect(feature.name).toBe('Basic Working Example');

        expect(feature.scenarios[0].name).toBe('Basic Example with Calculator');
        expect(feature.scenarios[0].steps[0]).toBe('Given I am using a calculator');
        expect(feature.scenarios[0].steps[1]).toBe('And I enter 50 into the calculator');
        expect(feature.scenarios[0].steps[2]).toBe('And I enter 70 into the calculator');
        expect(feature.scenarios[0].steps[3]).toBe('When I press the total button');
        expect(feature.scenarios[0].steps[4]).toBe('Then the result should be 120 on the screen');
        
        expect(feature.scenarios[1].name).toBe('Basic Example with Table Example 1 ["1","1","2"]');
        expect(feature.scenarios[1].steps[0]).toBe('Given I am using a calculator');
        expect(feature.scenarios[1].steps[1]).toBe('And I enter 1 into the calculator');
        expect(feature.scenarios[1].steps[2]).toBe('And I enter 1 into the calculator');
        expect(feature.scenarios[1].steps[3]).toBe('When I press the total button');
        expect(feature.scenarios[1].steps[4]).toBe('Then the result should be 2 on the screen');

        expect(feature.scenarios[2].name).toBe('Basic Example with Table Example 2 ["1","2","3"]');
        expect(feature.scenarios[2].steps[0]).toBe('Given I am using a calculator');
        expect(feature.scenarios[2].steps[1]).toBe('And I enter 1 into the calculator');
        expect(feature.scenarios[2].steps[2]).toBe('And I enter 2 into the calculator');
        expect(feature.scenarios[2].steps[3]).toBe('When I press the total button');
        expect(feature.scenarios[2].steps[4]).toBe('Then the result should be 3 on the screen');

        expect(feature.scenarios[3].name).toBe('Basic Example with Table Example 3 ["2","3","5"]');
        expect(feature.scenarios[3].steps[0]).toBe('Given I am using a calculator');
        expect(feature.scenarios[3].steps[1]).toBe('And I enter 2 into the calculator');
        expect(feature.scenarios[3].steps[2]).toBe('And I enter 3 into the calculator');
        expect(feature.scenarios[3].steps[3]).toBe('When I press the total button');
        expect(feature.scenarios[3].steps[4]).toBe('Then the result should be 5 on the screen');

        expect(feature.scenarios[4].name).toBe('Basic Example with Table Example 4 ["8","3","11"]');
        expect(feature.scenarios[4].steps[0]).toBe('Given I am using a calculator');
        expect(feature.scenarios[4].steps[1]).toBe('And I enter 8 into the calculator');
        expect(feature.scenarios[4].steps[2]).toBe('And I enter 3 into the calculator');
        expect(feature.scenarios[4].steps[3]).toBe('When I press the total button');
        expect(feature.scenarios[4].steps[4]).toBe('Then the result should be 11 on the screen');

        expect(feature.scenarios[5].name).toBe('Basic Example with Table Example 5 ["9","8","17"]');
        expect(feature.scenarios[5].steps[0]).toBe('Given I am using a calculator');
        expect(feature.scenarios[5].steps[1]).toBe('And I enter 9 into the calculator');
        expect(feature.scenarios[5].steps[2]).toBe('And I enter 8 into the calculator');
        expect(feature.scenarios[5].steps[3]).toBe('When I press the total button');
        expect(feature.scenarios[5].steps[4]).toBe('Then the result should be 17 on the screen');

        expect(feature.scenarios.length).toBe(6);
    });

});