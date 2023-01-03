/**
 * @typedef {{ steps(mapper: (regEx: RegExp, func: Function) => void): void }} StepModule
 */
export class JestSpec {
    /**
     * Constructor
     * @param {boolean} verbose
     */
    constructor(verbose: boolean);
    verbose: boolean;
    stepMap: any[];
    missingSteps: number;
    /**
     * Adds a step to the step map
     * @param {RegExp} regex
     * @param {Function} func
     */
    map(regex: RegExp, func: Function): void;
    /**
     * Adds step definitions from the supplied module
     * @param {StepModule} stepModule
     */
    addSteps(stepModule: StepModule): void;
    /**
     * Parses feature text
     * @param {string} text
     * @returns
     */
    parse(text: string): Promise<{
        feature: any;
        scenario: string;
        steps: any[];
    }[]>;
    /**
     * Runs a specification based on a relative path, i.e. /src/specifications/Feature.feature
     * @param {string} spec
     */
    run(spec: string): Promise<void>;
}
export type StepModule = {
    steps(mapper: (regEx: RegExp, func: Function) => void): void;
};
