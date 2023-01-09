import { Calculator } from '../../sample/calculator.mjs';

export function steps(map) {

    map(/Switch on the calculator$/i, (context) => {
        context.calculator = new Calculator();
        return context;
    });

    map(/Enter (\d+) and press the \+ button$/i, (context, number) => {
        context.calculator.add(number);
        return context;
    });

    map(/Enter (\d+) and press the = button$/i, (context, number) => {
        context.calculator.add(number);
        context.total = context.calculator.getTotal();
        return context;
    });

    map(/The answer should be (\d+)$/i, (context, expected) => {
        expect(context.total).toBe(expected);
        return context;
    });

}