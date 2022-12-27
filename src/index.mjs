import fs from 'fs';
import path from 'path';
import { SpecParser } from './spec-parser.mjs';

/**
 * @typedef {{ steps(mapper: (regEx: RegExp, func: Function) => void): void }} StepModule
 */

const tokens = {
    feature: /^\s*Feature: (.*)/i,
    outline: /^\s*Scenario Outline: (.*)/i,
    examples: /^\s*Examples:/i,
    scenario: /^\s*Scenario: (.*)/i,
    step: /^\s*Given (.*)|When (.*)|Then (.*)|And (.*)/i
}

export class JestSpec {
    /**
     * Constructor
     * @param {boolean} verbose 
     */
    constructor(verbose) {
        // Sensible defaults
        this.verbose = verbose ?? false;
        this.stepMap = [];
        this.missingSteps = 0;
    }

    /**
     * Adds a step to the step map
     * @param {RegExp} regex 
     * @param {Function} func 
     */
    map(regex, func) {
        this.stepMap.push({
            regex: regex,
            func: func
        });
    }

    /**
     * Adds step definitions from the supplied module
     * @param {StepModule} stepModule 
     */
    addSteps(stepModule) {
        const _this = this;
        stepModule.steps((regex, func) => _this.map(regex, func));
    }

    /**
     * Parses feature text
     * @param {string} text 
     * @returns 
     */
    async parse(text) {
        const testMap = [];

        const parser = new SpecParser();
        const feature = parser.parse(text);

        this.verbose && console.log('Structured feature', feature);

        for (const scenario of feature.scenarios) {
            
            const testItem = {
                feature: feature.name,
                scenario: scenario.name,
                steps: []
            };

            for (const step of scenario.steps) {

                let stepFound = false;

                const argumentParser = new ArgumentParser(step);

                this.stepMap.forEach((val) => {
                    const regexMatch = val.regex.exec(step);
                    if (regexMatch && regexMatch.length > 0) {
                        const args = [
                            null
                        ];

                        for (let i = 1; i < regexMatch.length; i++) {
                            args.push(regexMatch[i]);
                        }

                        stepFound = true;
                        testItem.steps.push({
                            name: step,
                            func: val.func,
                            args: argumentParser.getArgs(val.regex, args)
                        });
                    }
                });

                if (!stepFound) {
                    this.missingSteps++;
                    const codeBuilder = new StepMethodBuilder(argumentParser);
                    console.error('Missing step. Consider adding code:\n', codeBuilder.getSuggestedStepMethod());
                }
            }

            testMap.push(testItem);
        }

        this.verbose && console.log('Test map', testMap);

        return testMap;
    }

    /**
     * Runs a specification based on a relative path, i.e. /src/specifications/Feature.feature
     * @param {string} spec 
     */
    async run(spec) {
        const featurePath = path.join(process.cwd(), spec);
        const text = fs.readFileSync(featurePath, {encoding:'utf8', flag:'r'});

        const tests = await this.parse(text);

        if (this.missingSteps > 0) {
            throw new Error(`${this.missingSteps} missing steps`);
        }

        for (const test of tests) {
            this.verbose && console.log('Running Scenario', test.feature, test.scenario, test.steps.length);
            let context = {
                feature: test.feature,
                scenario: test.scenario
            };
            for (const step of test.steps) {
                step.args[0] = context;
                this.verbose && console.log('Running step', step.name);
                context = await step.func.apply(null, step.args);
            }
        }
    }
}

class StepMethodBuilder {
    constructor(argumentParser) {
        this.argumentParser = argumentParser;
     }

    getSuggestedStepMethod() {
        /* Template for step method */
        const params = this.argumentParser.getParameters();
        const comma = (params.length > 0) ? ', ' : '';

        const suggestion = `    map(/${this.argumentParser.getCondition()}$/i, (context${comma}${params}) => {
            // Write your step code here
            throw new Error('Step not yet implemented');
            return context;
        });`;

        return suggestion;
    }
}

class ArgumentParser {
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

        if (!args) {
            return [null];
        }

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

const ExpressionLibrary = {
    // RegExp members
    quotedArgumentsRegExp: /("(?:[^"\\]|\\.)*")/ig,
    defaultStepRegExp: /"(?:[^"\\]|\\.)*"/ig,
                                      
    // Part one finds things like "(.*)" and (\"\d+\") = /([\.\\]([*a-z])\+?)/g;
    // Part two finds things like (\"true\"|\"false\") = \(\\\"true\\\"\|\\"false\\\"\)
    regexFinderRegExp: /([\.\\]([*a-z])\+?)|\(\\\"true\\\"\|\\\"false\\\"\)/g,

    // String members
    defaultString: '"(.*)"',
    numberString: '(\\"\\d+\\")',
    trueFalseString: '(\\"true\\"|\\"false\\")',
}