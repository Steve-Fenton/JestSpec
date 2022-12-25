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
    constructor() {
        // Sensible defaults
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
                console.log('Feature Found', featureName);
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
                console.log('Scenario Found', scenarioName);

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

                            testItem.steps.push({
                                name: line,
                                func: val.func,
                                args: args
                            });
                        } else {
                            console.error('Missing step:', line);
                        }
                    });
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
            console.log('Running Scenario', x.feature, x.scenario, x.steps.length);
            let context = {
                feature: x.feature,
                scenario: x.scenario
            };
            for (const s of x.steps) {
                s.args[0] = context;
                console.log('Running step', s.name);
                context = await s.func.apply(null, s.args);
            }
        }
    }
}
