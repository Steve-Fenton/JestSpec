export class Calculator {
    constructor() {
        this.total = 0;
    }

    add(number) {
        this.total += parseInt(number, 10);
    }

    getTotal() {
        return this.total;
    }
}