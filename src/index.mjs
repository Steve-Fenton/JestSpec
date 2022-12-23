import fs from 'fs';
import path from 'path';

export class JestSpec {
    constructor() {
        // Sensible defaults
        this.steps = ['**/*.step.js', '**/*.step.mjs'];
        this.features = ['**/*.feature'];
        this.stepMap = [];
    }

    addSteps(steps) {
        this.steps = steps;
    }

    addFeatures(features) {
        this.features = features;
    }

    map(regex, func) {
        this.stepMap.push({
            regex: regex,
            func: func
        });
    }
    
    getMatch(line, regex) {
        const matches = line.match(regex) ?? [];

        return matches.filter(m => m && m != line);
    }
    
    async run() {
        // TODO: Hard coded, should loop around results from this.steps
        const stepModule = await import('./tests/steps/calculator.steps.mjs');
        const _this = this;
        stepModule.steps((regex, func) => _this.map(regex, func));

        const featurePath = path.join(process.cwd(), '/src/tests/Basic.feature')

        // TODO: Hard coded, should loop around results from this.features
        const feature = fs.readFileSync(featurePath, {encoding:'utf8', flag:'r'});
        const lines = feature.replace(/\r\n/g, '\n').split('\n');
        
        let inFeature = false;
        let featureName = null;
        let inScenario = false;
        let scenarioName = null;
        let inStep = false;
        let stepName = null;

        const testMap = [];
        let testItem = null;

        const tokens = {
            feature: /^\s*Feature: (.*)/i,
            scenario: /^\s*Scenario: (.*)/i,
            step: /^\s*Given (.*)|When (.*)|Then (.*)|And (.*)/i
        }

        for (const line of lines) {
            const featureMatch = this.getMatch(line, tokens.feature);
            if (featureMatch && featureMatch.length > 0) {
                inFeature = true;
                featureName = featureMatch[0].trim();
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
                    inStep = true;
                    stepName = line;

                    this.stepMap.forEach((val) => {
                        const regexMatch = stepName.match(val.regex);
                        if (regexMatch && regexMatch.length > 0) {
                            const args = [
                                null
                            ];

                            for (let i = 1; i < regexMatch.length; i++) {
                                args.push(regexMatch[i]);
                            }

                            testItem.steps.push({
                                func: val.func,
                                args: args
                            });
                        }
                    });
                }
            }
        }

        return testMap;
    }
}
