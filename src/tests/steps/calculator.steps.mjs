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

    map(/And I enter (\d+) and (\d+) into the calculator$/i, (context, num1, num2) => {
        context.calculator.add(num1);
        context.calculator.add(num2);
        return context;
    });

    map(/And I speak "(.*)" into the calculator$/i, (context, sentence) => {
        const matches = sentence.match(/(\+|-)?((\d+(\.\d+)?)|(\.\d+))/);
        const num = parseFloat(matches[0]);
        context.calculator.add(num);
        return context;
    });

    map(/And I asynchronously enter (\d+) into the calculator$/i, async (context, number) => {
        await context.calculator.addAsync(number);
        return context;
    });

    map(/I press the total button$/gi, (context) => {
        context.total = context.calculator.getTotal();
        return context;
    });

    map(/the result should be (\d+) on the screen$/i, (context, expected) => {
        expect(context.total).toBe(expected);
        return context;
    });
}