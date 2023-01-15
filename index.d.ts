export type Context = {
    [key: string]: any;
}

export type Step = {
    (context: context, ...args: any[]): Context;
}

export type Mapper = {
    (regEx: RegExp, func: Step): void;
}

export type StepModule = {
    steps(mapper: (regEx: RegExp, func: Step) => void): void;
};

export class JestSpec {
    constructor(verbose: boolean, context: Context);
    map: Mapper;
    addSteps(stepModule: StepModule): void;
    parse(text: string): Promise<{
        feature: any;
        scenario: string;
        steps: any[];
    }[]>
    run(spec: string): Promise<void>;
}

