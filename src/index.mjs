import fs from 'fs';
import path from 'path';

/**
 * @typedef {{ steps(mapper: (regEx: RegExp, func: Function) => void): void }} StepModule
 */

const tokens = {
    feature: /^\s*Feature: (.*)/i,
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
        this.steps = 'src/tests/steps/';
        this.features = ['**/*.feature'];
        this.stepMap = [];
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
     * Checks a string against a regular expression
     * @param {string} line 
     * @param {RegExp} regex 
     * @returns string[]
     */
    getMatch(line, regex) {
        const matches = line.match(regex) ?? [];
        return matches.filter(m => m && m != line);
    }

    /**
     * Adds step definitions
     * @param {StepModule} stepModule 
     */
    addSteps(stepModule) {
        const _this = this;
        stepModule.steps((regex, func) => _this.map(regex, func));
    }

    /**
     * Parses feature text
     * @param {string} feature 
     * @returns 
     */
    async parse(feature) {
        const lines = feature.replace(/\r\n/g, '\n').split('\n');
        
        let inFeature = false;
        let featureName = null;
        let inScenario = false;
        let scenarioName = null;

        const testMap = [];
        let testItem = null;

        for (const line of lines) {
            const featureMatch = this.getMatch(line, tokens.feature);
            if (featureMatch && featureMatch.length > 0) {
                inFeature = true;
                featureName = featureMatch[0].trim();
                this.verbose && console.log('Feature Found', featureName);
                continue;
            }

            const scenarioMatch = this.getMatch(line, tokens.scenario);
            if (scenarioMatch && scenarioMatch.length > 0) {
                if (inScenario) {
                    // Switching to a new scenario now
                    if (testItem) {
                        testMap.push(testItem);
                    }
                }

                inScenario = true;
                scenarioName = scenarioMatch[0].trim();
                this.verbose && console.log('Scenario Found', scenarioName);

                testItem = {
                    feature: featureName,
                    scenario: scenarioName,
                    steps: []
                };

                if (!inFeature) {
                    console.warn(`"${line}" is not within a feature. Check your file has a "Feature:".`)
                }
                continue;
            }

            if (inFeature && inScenario) {

                const stepMatch = this.getMatch(line, tokens.step);
                let stepFound = false;
                if (stepMatch && stepMatch.length > 0) {
                    this.stepMap.forEach((val) => {
                        const regexMatch = line.match(val.regex);
                        if (regexMatch && regexMatch.length > 0) {
                            const args = [
                                null
                            ];

                            for (let i = 1; i < regexMatch.length; i++) {
                                args.push(regexMatch[i]);
                            }

                            stepFound = true;
                            testItem.steps.push({
                                name: line,
                                func: val.func,
                                args: args
                            });
                        }

                    });

                    if (!stepFound) {
                        const argumentParser = new ArgumentParser(line);
                        const codeBuilder = new StepMethodBuilder(argumentParser);
                        console.error('Missing step. Consider adding code:\n', codeBuilder.getSuggestedStepMethod());
                    }
                }
            }
        }

        if (testItem) {
            testMap.push(testItem);
        }

        return testMap;
    }

    

    /**
     * Runs a specification based on a relative path, i.e. /src/specifications/Feature.feature
     * @param {string} spec 
     */
    async run(spec) {
        const featurePath = path.join(process.cwd(), spec);
        const feature = fs.readFileSync(featurePath, {encoding:'utf8', flag:'r'});

        const tests = await this.parse(feature);

        for (const x of tests) {
            this.verbose && console.log('Running Scenario', x.feature, x.scenario, x.steps.length);
            let context = {
                feature: x.feature,
                scenario: x.scenario
            };
            for (const s of x.steps) {
                s.args[0] = context;
                this.verbose && console.log('Running step', s.name);
                context = await s.func.apply(null, s.args);
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
            context.calculator = new Calculator();
            return context;
        });`;

        // const suggestion = '    @step(/^' + this.argumentParser.getCondition() + '$/i)\n' +
        //     '    stepName(context: any' + comma + params + ') {\n' +
        //     '        throw new Error(\'Not implemented.\');\n' +
        //     '    }';

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
}

const ExpressionLibrary = {
    // RegExp members
    quotedArgumentsRegExp: /("(?:[^"\\]|\\.)*")/ig,
    defaultStepRegExp: /"(?:[^"\\]|\\.)*"/ig,
                                      
    // Part one finds things like "(.*)" and (\"\d+\") = /([\.\\]([*a-z])\+?)/g;
    // Part two finds things like (\"true\"|\"false\") = \(\\\"true\\\"\|\\"false\\\"\)
    regexFinderRegExp: /([\.\\]([*a-z])\+?)|\(\\\"true\\\"\|\\"false\\\"\)/g,

    // String members
    defaultString: '"(.*)"',
    numberString: '(\\"\\d+\\")',
    trueFalseString: '(\\"true\\"|\\"false\\")',
}