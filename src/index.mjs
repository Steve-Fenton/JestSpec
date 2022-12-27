import fs from 'fs';
import path from 'path';

/**
 * @typedef {{ steps(mapper: (regEx: RegExp, func: Function) => void): void }} StepModule
 * @typedef {{ name: string; steps: string[]; line: number; }} Scenario
 * @typedef {{ lines: string[]; feature: string; scenarios: Scenario[]; }} Summary
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
        this.steps = 'src/tests/steps/';
        this.features = ['**/*.feature'];
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
     * Checks a string against a regular expression
     * @param {string} line 
     * @param {RegExp} regex 
     * @returns string[]
     */
    getMatch(line, regex) {
        const matches = regex.exec(line) ?? [];
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

    getLines(feature) {
        return feature.replace(/\r\n/g, '\n').split('\n');
    }

    /**
     * Creates the initial summary of a feature
     * @param {string} feature 
     * @returns {Summary}
     */
    getSummary(feature) {
        const lines = this.getLines(feature);

        const summary = {
            lines: lines,
            feature: '',
            scenarios: []
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const featureMatch = this.getMatch(line, tokens.feature);

            if (featureMatch && featureMatch.length > 0) {
                summary.feature = featureMatch[0].trim();
                continue;
            }

            const scenarioMatch = this.getMatch(line, tokens.scenario);
            const outlineMatch = this.getMatch(line, tokens.outline);

            if (scenarioMatch && scenarioMatch.length > 0 || outlineMatch && outlineMatch.length > 0) {
                summary.scenarios.push({
                    name: (scenarioMatch[0] ?? outlineMatch[0]).trim(),
                    line: i,
                    steps: []
                }); 
            }
        }

        return summary;
    }

    /**
     * Assigns steps to scenarios
     * @param {Summary} summary 
     * @returns {Summary}
     */
    assignSteps(summary) {
        for (let i = 0; i < summary.scenarios.length; i++) {
            const scenario = summary.scenarios[i];
            const nextScenario = summary.scenarios[i + 1] ?? { line: summary.lines.length };

            const start = scenario.line + 1;
            const end = nextScenario.line - 1;

            for (let l = start; l <= end; l++) {
                // This just removes leading and trailing white space
                const trimmedLine = summary.lines[l].trim();
                // This finds table separator rows, i.e. |-----|-----|-----|, so they can be removed
                const superTimmedLine = trimmedLine.replace(/\|/g, '').replace(/-/g, '');

                if (trimmedLine && superTimmedLine) {
                    // Only add lines with content
                    summary.scenarios[i].steps.push(trimmedLine);
                }
            }
        }
        
        return summary;
    }

    /**
     * Extracts examples into multiple scenarios
     * @param {Summary} summary 
     * @returns {Summary}
     */
    extractExamples(summary) {
        const newScenarios = [];

        for (let i = 0; i < summary.scenarios.length; i++) {
            const scenario = summary.scenarios[i];
            let stepEnd = 0;
            let exampleHeader = 0;
            let exampleRowStart = 0;

            // Find where examples start
            for (let j = 0; j < scenario.steps.length; j++) {
                const exampleMatch = tokens.examples.exec(scenario.steps[j]);
                if (exampleMatch && exampleMatch.length > 0) {
                    stepEnd = j;
                    exampleHeader = j + 1;
                    exampleRowStart = j + 2;
                    break;
                }
            }

            // Process examples
            if (exampleHeader > 0) {
                
                const steps = scenario.steps.slice(0, stepEnd);
                const headers = scenario.steps[exampleHeader].split('|').filter(h => !!h).map(h => `<${h.trim()}>`);

                for (let j = exampleRowStart; j < scenario.steps.length; j++) {
                    const values = scenario.steps[j].split('|').filter(v => !!v).map(v => v.trim());

                    newScenarios.push({
                        name: `${scenario.name} Example ${j - exampleHeader} ${JSON.stringify(values)}`,
                        line: 0,
                        steps: steps.map(s => {
                            for (let k = 0; k < headers.length; k++) {
                                s = s.replace(headers[k], values[k]);
                            }

                            return s;
                        })
                    });
                }
    
                // remove the template step, add the new scenarios
                summary.scenarios[i] = null;
            }
        }

        // Remove the null scenarios (they were templates)
        summary.scenarios = summary.scenarios.filter(s => !!s);

        // Add the scenarios generated from templates
        for (const ns of newScenarios) {
            summary.scenarios.push(ns);
        }

        return summary;
    }

    /**
     * Parses feature text
     * @param {string} feature 
     * @returns 
     */
    async parse(feature) {
        const lines = this.getLines(feature);

        //const summary = this.getSummary(feature);
        
        let inFeature = false;
        let featureName = null;

        let inOutline = false;
        let inExample = false;

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
            const outlineMatch = this.getMatch(line, tokens.outline);
            if (scenarioMatch && scenarioMatch.length > 0
                || outlineMatch && outlineMatch.length > 0) {
                if (inScenario) {
                    // Switching to a new scenario now
                    if (testItem) {
                        testMap.push(testItem);
                    }
                }

                inExample = false;
                inScenario = true;
                scenarioName = (scenarioMatch[0] ?? outlineMatch[0]).trim();
                inOutline = (outlineMatch && outlineMatch.length > 0);
                this.verbose && console.log('Scenario Found', scenarioName);

                testItem = {
                    feature: featureName,
                    scenario: scenarioName,
                    steps: [],
                    examples: []
                };

                if (!inFeature) {
                    console.warn(`"${line}" is not within a feature. Check your file has a "Feature:".`)
                }
                continue;
            }

            const exampleMatch = tokens.examples.exec(line);
            if (exampleMatch && exampleMatch.length > 0) {
                inExample = true;
                continue;
            }

            if (inFeature && inScenario && !inExample) {

                let stepFound = false;
                const stepMatch = this.getMatch(line, tokens.step);
                if (stepMatch && stepMatch.length > 0) {
                    
                    const argumentParser = new ArgumentParser(line);

                    this.stepMap.forEach((val) => {
                        const regexMatch = val.regex.exec(line);
                        if (regexMatch && regexMatch.length > 0) {
                            const args = [
                                null
                            ];

                            for (let i = 1; i < regexMatch.length; i++) {
                                args.push(regexMatch[i]);
                            }

                            stepFound = true;
                            testItem.steps.push({
                                name: line.trim(),
                                func: val.func,
                                args: argumentParser.getArgs(line, val.regex, args)
                            });
                        }
                    });

                    if (!stepFound) {
                        this.missingSteps++;
                        const codeBuilder = new StepMethodBuilder(argumentParser);
                        console.error('Missing step. Consider adding code:\n', codeBuilder.getSuggestedStepMethod());
                    }
                }
            }

            if (inExample) {
                const examples = line.trim().split('|').filter(s => !!s).map(s => s.trim());
                testItem.examples.push(examples);
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

        if (this.missingSteps > 0) {
            throw new Error(`${this.missingSteps} missing steps`);
        }

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
     * @param {string} text 
     * @param {RegExp} findExpression 
     * @returns 
     */
    getArgs(text, findExpression, args) {
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