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

    map(/And I asynchronously enter (\d+) into the calculator$/i, async (context, number) => {
        await context.calculator.addAsync(number);
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