import fs from 'fs';
import path from 'path';
import { ArgParser } from './src/arg-parser.mjs';
import { SpecParser } from './src/spec-parser.mjs';
import { StepBuilder } from './src/step-builder.mjs';

/**
 * @typedef {{ steps(mapper: (regEx: RegExp, func: Function) => void): void }} StepModule
 */

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

                const argumentParser = new ArgParser(step);

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
                    const codeBuilder = new StepBuilder(argumentParser);
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

            // Context used to pass state between steps
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