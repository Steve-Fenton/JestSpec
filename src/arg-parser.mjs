import { get } from "http";

const ExpressionLibrary = {
    // RegExp members
    quotedArgumentsRegExp: /("(?:[^"\\]|\\.)*")/ig,
    defaultStepRegExp: /"(?:[^"\\]|\\.)*"/ig,
                                      
    // Meta RegExp finder
    regexFinderRegExp: /([\.\\]([*a-z])\+?)|\(\\\"true\\\"\|\\\"false\\\"\)/g,

    // String, number, boolean
    defaultString: '"(.*)"',
    numberString: '(\\"\\d+\\")',
    trueFalseString: '(\\"true\\"|\\"false\\")',
}

export class ArgParser {
    /**
     * Constructor
     * @param {string} originalCondition 
     */
    constructor(originalCondition) {
        this.arguments = [];
        this.originalCondition = originalCondition;
        this.condition = originalCondition;
        this.parseArguments()
    }

    getCondition() {
        return this.condition.trim();
    }

    getConditionWithoutKeyword() {
        const text = this.getCondition();
        const space = text.indexOf(' ') + 1;
        return text.substring(space);
    }

    getParameters() {
        return this.arguments.join(', ');
    }

    parseArguments() {
        const foundArguments = this.originalCondition.match(ExpressionLibrary.quotedArgumentsRegExp);

        if (!foundArguments || foundArguments.length === 0) {
            return;
        }

        for (let i = 0; i < foundArguments.length; i++) {
            const foundArgument = foundArguments[i];
            this.replaceArgumentWithExpression(foundArgument, i);
        }
    }

    replaceArgumentWithExpression(quotedArgument, position) {
        const trimmedArgument = quotedArgument.replace(/"/g, '');
        let argumentExpression = '';

        this.arguments.push('p' + position);
        if (this.isBooleanArgument(trimmedArgument)) {
            argumentExpression = ExpressionLibrary.trueFalseString;
        } else if (this.isNumericArgument(trimmedArgument)) {
            argumentExpression = ExpressionLibrary.numberString;
        } else {
            argumentExpression = ExpressionLibrary.defaultString;
        }

        this.condition = this.condition.replace(quotedArgument, argumentExpression);
    }

    isBooleanArgument(argument) {
        return (argument.toLowerCase() === 'true' || argument.toLowerCase() === 'false');
    }

    isNumericArgument(argument) {
        return (parseFloat(argument).toString() === argument);
    }

    /**
     * Gets typed parameters from an input step
     * @param {RegExp} findExpression 
     * @param {string[]} args 
     * @returns 
     */
    getArgs(findExpression, args) {
        const typeIndicators = findExpression.source.toString().match(ExpressionLibrary.regexFinderRegExp) || [];

        let result = [null];
        for (let i = 1; i < args.length; i++) {
            let match = args[i];
            match = match.replace(/^"(.+(?="$))"$/, '$1');
            match = match.replace(/^'(.+(?='$))'$/, '$1');

            const paramIndex = i;
            const indicator = typeIndicators[i - 1] || '';

            switch (indicator) {
                case "\\d+":
                    result[paramIndex] = parseFloat(match);
                    break;
                case "(\\\"true\\\"|\\\"false\\\")":
                    result[paramIndex] = (match.toLowerCase() === 'true');
                    break;
                default:
                    result[paramIndex] = match;
            }
        }

        return result;
    }
}