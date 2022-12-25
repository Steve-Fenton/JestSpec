export class Calculator {
    constructor() {
        this.total = 0;
    }

    add(number) {
        this.total += parseInt(number, 10);
    }

    async addAsync(number) {
        return new Promise(resolve => {
            setTimeout(() => {
                this.total += parseInt(number, 10);
              resolve('resolved');
            }, 10);
          });
    }

    getTotal() {
        return this.total;
    }
}