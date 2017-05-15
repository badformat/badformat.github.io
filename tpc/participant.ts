import { Coordinator } from './coordinator';
import { ITransaction } from './transaction';

import { Map, List } from 'immutable';

class Transaction implements ITransaction {
    private state = 'Init';
    private timeoutSeconds = 10;
    private ttl = 10;

    private promise: Promise<{}>;

    constructor(public readonly id: number, public readonly owner: Participant) {
        this.promise = new Promise(resolve => {
            setTimeout(() => { resolve(); this.timeout(); }, this.timeoutSeconds * 1000);
        });

        let intervalId = setInterval(() => {
            if (this.state !== 'Wait' && this.state !== 'Init') {
                clearInterval(intervalId);
            }
            if (this.ttl > 0) {
                this.ttl--;
            } else {
                clearInterval(intervalId);
            }
        }, 1000);
    };

    public getState() {
        return this.state;
    }

    public getTTL() {
        return this.ttl;
    }

    toReady() {
        this.state = 'Ready';
    }

    toCommit() {
        this.state = 'Commit';
    }

    toAbort() {
        this.state = 'Abort';
    }

    async wait() {
        await this.promise;
    }

    timeout() {
        if (this.state === 'Ready') {
            this.owner.transactionTimeout(this);
        }
    }
}

export class Participant {
    private transactions: Map<number, Transaction> = Map<number, Transaction>();
    private others: List<Participant> = List<Participant>();

    private disconnected = false;

    constructor(public readonly name: String, public readonly co: Coordinator) {
        co.joinParticpant(this);
    }

    public voteCommit(txId: number) {
        if (this.disconnected) {
            return;
        }
        let tx = this.transactions.get(txId);
        tx.toReady();
        this.co.voteCommit(this, txId);
    }

    public voteAbort(txId: number) {
        if (this.disconnected) {
            return;
        }

        let tx = this.transactions.get(txId);
        tx.toAbort();
        this.co.voteAbort(this, txId);
    }

    public globalCommit(txId: number) {
        if (this.disconnected) {
            return;
        }
        let tx = this.transactions.get(txId);
        tx.toCommit();
    }

    public globalAbort(txId: number) {
        if (this.disconnected) {
            return;
        }
        let tx = this.transactions.get(txId);
        tx.toAbort();
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

    public disconnect() {
        this.disconnected = true;
    }

    public isConnected() {
        return !this.disconnected;
    }

    public reconnect() {
        this.disconnected = false;
        this.transactions.forEach(tx => {
            this.determineTxState(tx);
        });
    }

    transactionTimeout(tx: Transaction) {
        this.determineTxState(tx);
    }

    determineTxState(tx: Transaction) {
        if (tx.getState() === 'Commit' || tx.getState() === 'Abort') {
            return;
        }
        this.others.forEach(p => {
            let ptx = p.getTransactions().get(tx.id);
            if (ptx.getState() === 'Commit') {
                tx.toCommit();
                return;
            }
            if (ptx.getState() === 'Abort') {
                tx.toAbort();
                return;
            }
            if (ptx.getState() === 'Init') {
                tx.toAbort();
            }
        });
    }

    async wait(txId: number) {
        let tx = this.transactions.get(txId);
        await tx.wait();
    }

}
