export class StepBuilder {
    constructor(argumentParser) {
        this.argumentParser = argumentParser;
     }

    getSuggestedStepMethod() {
        /* Template for step method */
        const params = this.argumentParser.getParameters();
        const comma = (params.length > 0) ? ', ' : '';

        const suggestion = `    map(/${this.argumentParser.getConditionWithoutKeyword()}$/i, (context${comma}${params}) => {
            // Write your step code here
            throw new Error('Step not yet implemented');
            return context;
        });`;

        return suggestion;
    }
}