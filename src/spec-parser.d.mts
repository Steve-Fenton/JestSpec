export class SpecParser {
    /**
     * Parses a text feature into a structured feature
     * @param {string} text
     * @returns Feature
     */
    parse(text: string): Feature;
    /**
     * Splits feature text into lines to process
     * @param {string} feature
     * @returns {string[]}
     */
    getLines(text: any): string[];
    /**
     * Checks a string against a regular expression
     * @param {string} line
     * @param {RegExp} regex
     * @returns string[]
     */
    getMatch(line: string, regex: RegExp): string[];
    /**
     * Creates the initial summary of a feature
     * @param {string} text
     * @returns {Feature}
     */
    getSummary(text: string): Feature;
    /**
     * Assigns steps to scenarios
     * @param {Feature} summary
     * @returns {Feature}
     */
    assignSteps(summary: Feature): Feature;
    /**
     * Extracts examples into multiple scenarios
     * @param {Feature} summary
     * @returns {Feature}
     */
    extractExamples(summary: Feature): Feature;
}
export type Scenario = {
    name: string;
    steps: string[];
    line: number;
};
export type Feature = {
    lines: string[];
    feature: string;
    scenarios: Scenario[];
};
