# JestSpec

Gherkin feature files for Jest.

This project is a re-imagining of Gherkin features for JavaScript, based on lessons learned from writing and consuming specification-based test libraries for many languages.

The project was started by copying the specifications from TypeSpec (which I wrote for TypeScript).

The idea is to use Jest to provide the test goodies, but allow Gherkin specifications to drive the tests.

## Basic example

There are three files:

1. A specification file written in Gherkin
2. A step file that runs each step
3. A Jest test that wraps the specification

### Specification file

`Calculator.feature`

```gherkin
Feature: Basic Working Example
    In order to avoid silly mistakes
    As a math idiot
    I want to be told the sum of two numbers

Scenario: Basic Example with Calculator
    Given I am using a calculator
    And I enter 50 into the calculator
    And I enter 70 into the calculator
    When I press the total button
    Then the result should be 120 on the screen
```

### Step file

The step file exports a `steps` function that maps each sentence to a processor function. The processor function always takes the test `context` as the first argument (and returns the `context` at the end).

If you have arguments in your specification, they are passed after the `context`.

`calculator.steps.mjs`

```javascript
import { Calculator } from '../../sample/calculator.mjs';

export function steps(map) {

    map(/I am using a calculator$/i, (context) => {
        context.calculator = new Calculator();
        return context;
    });

    map(/I enter (\d+) into the calculator$/i, (context, number) => {
        context.calculator.add(number);
        return context;
    });

    map(/I press the total button$/gi, (context) => {
        context.total = context.calculator.getTotal();
        return context;
    });

    map(/the result should be (\d+) on the screen$/i, (context, expected) => {
        expected = parseInt(expected, 10);

        expect(context.total).toBe(expected);
        return context;
    });
}
```

### Jest test

The Jest test in a file such as `calculator.test.mjs`

```javascript
import { JestSpec } from 'jest-spec';
import * as CalculatorSteps from './steps/calculator.steps.mjs';

const spec = new JestSpec();
spec.addSteps(CalculatorSteps);

test('Async steps', async () => {
    await spec.run('/src/specifications/AsyncSteps.feature');
});
```

## Using other test frameworks

JestSpec works with most JavaScript test frameworks.

The example is based on running specifications within Jest, but in practice, you can use other test frameworks to wrap your specifications. Just use the appropriate assertions in your step files and the relevant test code to wrap the `await spec.run` call.

## Missing steps

JestSpec will warn you if you have a missing step and supplies a code snippet to get you started:

```
  console.error
    Missing step. Consider adding code:
         map(/Then the result should be (\"\d+\") on the screen$/i, (context, p0) => {
                context.calculator = new Calculator();
                return context;
            });
```

The step code will contain regular expressions for any quoted variables, but if you aren't quoting variables, you can replace hard-coded values with:

- String: `(.*)`
- Number: `(\d+)`
- Boolean: `(true|false)`

We recommend you quote string variables, as the matching can be too general with no quotes. You might choose to quote all your variables, as the auto-generated steps will then be ready to use!

## Visual Studio Code experience

[Jest extension](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)

[Syntax highlighting for Gherkin extension](https://marketplace.visualstudio.com/items?itemName=Blodwynn.featurehighlight)