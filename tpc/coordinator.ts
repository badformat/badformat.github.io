export class Transaction {
    constructor(public readonly id: number, public readonly co: Coordinator) { };
}

export class Coordinator {
    private transactions: Transaction[] = [];

    public startTx(id: number): Transaction {
        let tx = new Transaction(id, this);
        this.transactions.push(tx);
        return tx;
    }
}
