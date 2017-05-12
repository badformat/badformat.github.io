import { Coordinator } from './coordinator';
import { ITransaction } from './transaction';

import { Map, List } from 'immutable';

class Transaction implements ITransaction {
    private state = 'Init';
    constructor(public readonly id: number, public readonly owner: Participant) { };

    public getState() {
        return this.state;
    }

    toReady() {
        this.state = 'Ready';
    }

    toCommit() {
        this.state = 'Commit';
    }
}

export class Participant {
    private transactions: Map<number, Transaction> = Map<number, Transaction>();
    private others: List<Participant> = List<Participant>();

    constructor(public readonly name: String, public readonly co: Coordinator) {
        co.joinParticpant(this);
    }

    public voteCommit(txId: number) {
        let tx = this.transactions.get(txId);
        tx.toReady();
        this.co.voteCommit(this, txId);
    }

    public globalCommit(txId: number) {
        let tx = this.transactions.get(txId);
        tx.toCommit();
    }

    public updateOthers(others: List<Participant>) {
        this.others = others.delete(others.indexOf(this));
    }

    public getOthers() {
        return this.others;
    }

    public addTrasaction(id: number) {
        this.transactions = this.transactions.set(id, new Transaction(id, this));
    }

    public getTransactions() {
        return this.transactions;
    }
}
