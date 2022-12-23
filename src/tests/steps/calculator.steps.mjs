import { Calculator } from './calculator.mjs';

export function steps(map) {

    map(/I am using a calculator$/i, (context) => {
        context.calculator = new Calculator();
    });

    map(/I enter (\"\d+\") into the calculator$/i, (context, number) => {
        context.calculator.add(number);
    });

    map(/I enter (\"\d+\") and (\"\d+\") into the calculator$/i, (context, num1, num2) => {
        context.calculator.add(num1);
        context.calculator.add(num2);
    });

    map(/I enter an unquoted (\d+) into the calculator$/i, (context, num) => {
        context.calculator.add(num);
    });

    map(/I speak "(.*)" into the calculator$/i, (context, sentence) => {
        const matches = sentence.match(/(\+|-)?((\d+(\.\d+)?)|(\.\d+))/) || ['0'];
        const num = parseFloat(matches[0]);
        context.calculator.add(num);
    });

    map(/I press the total button$/gi, (context) => {
        context.total = context.calculator.getTotal();
    });

    map(/the result should be (\"\d+\") on the screen$/i, (context, expected) => {
        expect(context.total).toBe(expected);
    });

    map(/the result should be an unquoted (\d+) on the screen$/i, (context, expected) => {
        expect(context.total).toBe(expected);
    });
}