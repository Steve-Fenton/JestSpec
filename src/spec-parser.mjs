/**
 * @typedef {{ name: string; steps: string[]; line: number; }} Scenario
 * @typedef {{ lines: string[]; feature: string; scenarios: Scenario[]; }} Feature
 */

const tokens = {
    feature: /^\s*Feature: (.*)/i,
    scenario: /^\s*Scenario: (.*)/i,
    outline: /^\s*Scenario Outline: (.*)/i,
    examples: /^\s*Examples:/i,
}

export class SpecParser {

    /**
     * Parses a text feature into a structured feature
     * @param {string} text
     * @returns Feature  
     */
    parse(text) {
        // TODO: Make this a pipeline
        const firstPass = this.getSummary(text);
        const secondPass = this.assignSteps(firstPass);
        const feature = this.extractExamples(secondPass);

        return feature;
    }

    /**
     * Splits feature text into lines to process
     * @param {string} feature 
     * @returns {string[]}
     */
    getLines(text) {
        return text.replace(/\r\n/g, '\n').split('\n');
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
     * Creates the initial summary of a feature
     * @param {string} text 
     * @returns {Feature}
     */
    getSummary(text) {
        const lines = this.getLines(text);

        const summary = {
            lines: lines,
            name: '',
            scenarios: []
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const featureMatch = this.getMatch(line, tokens.feature);

            if (featureMatch && featureMatch.length > 0) {
                summary.name = featureMatch[0].trim();
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
     * @param {Feature} summary 
     * @returns {Feature}
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
     * @param {Feature} summary 
     * @returns {Feature}
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

}