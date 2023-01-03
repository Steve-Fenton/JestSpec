export class ArgParser {
    /**
     * Constructor
     * @param {string} originalCondition
     */
    constructor(originalCondition: string);
    arguments: any[];
    originalCondition: string;
    condition: string;
    getCondition(): string;
    getParameters(): string;
    parseArguments(): void;
    replaceArgumentWithExpression(quotedArgument: any, position: any): void;
    isBooleanArgument(argument: any): boolean;
    isNumericArgument(argument: any): boolean;
    /**
     * Gets typed parameters from an input step
     * @param {RegExp} findExpression
     * @param {string[]} args
     * @returns
     */
    getArgs(findExpression: RegExp, args: string[]): any[];
}
