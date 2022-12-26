export function steps(map) {

    map(/I am passing arguments$/i, (context) => {
        context.firstArg = null;
        context.secondArg = null;
        return context;
    });

    map(/I pass (\"\d+\") and "(.*)" as arguments$/i, (context, arg1, arg2) => {
        context.firstArg = arg1;
        context.secondArg = arg2;
        return context;
    });

    map(/I pass (\"true\"|\"false\") and (\"true\"|\"false\") as arguments$/gi, (context, arg1, arg2) => {
        context.firstArg = arg1;
        context.secondArg = arg2;
        return context;
    });

    map(/the arguments should be number and string type$/i, (context) => {
        expect(typeof context.firstArg).toBe('number');
        expect(typeof context.secondArg).toBe('string');
        return context;
    });

    map(/the arguments should be boolean type$/i, (context) => {
        expect(typeof context.firstArg).toBe('boolean');
        expect(typeof context.secondArg).toBe('boolean');
        return context;
    });
}