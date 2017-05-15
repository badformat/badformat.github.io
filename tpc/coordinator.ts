import { Participant } from './participant';
import { ITransaction } from './transaction';

import { Map, List } from 'immutable';

class Transaction implements ITransaction {
    private state = 'Init';
    private voters: List<Participant> = List<Participant>();
    private timeoutSeconds = 10;
    private promise: Promise<{}>;
    private ttl = 10;
    constructor(public readonly id: number, public readonly co: Coordinator) { };

    public getState() {
        return this.state;
    }

    public getTTL() {
        return this.ttl;
    }

    toWait() {
        this.state = 'Wait';
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
    }

    toCommit() {
        this.state = 'Commit';
    }

    toAbort() {
        this.state = 'Abort';
    }

    addVoter(p: Participant) {
        this.voters = this.voters.push(p);
    }

    getVoters() {
        return this.voters;
    }

    setTimeout(timeout: number) {
        this.timeoutSeconds = timeout;
        this.ttl = timeout;
    }

    timeout() {
        if (this.state === 'Wait' || this.state === 'Init') {
            this.co.transactionTimeout(this);
        }
    }

    async wait() {
        await this.promise;
    }
}

export class Coordinator {
    private participants: List<Participant> = List<Participant>();
    private transactions: Map<number, Transaction> = Map<number, Transaction>();

    public addTransactionWithDefaultTimeout(id: number): Transaction {
        let tx = new Transaction(id, this);
        this.transactions = this.transactions.set(id, tx);
        return tx;
    }

    public addTransaction(id: number, timeout: number) {
        let tx = this.addTransactionWithDefaultTimeout(id);
        tx.setTimeout(timeout);
        return tx;
    }

    public joinParticpant(p: Participant) {
        this.participants = this.participants.push(p);
        this.participants.forEach((participant) => {
            participant.updateOthers(this.participants);
        });
    }

    public startVote(txId: number) {
        let tx = this.transactions.get(txId);
        tx.toWait();

        this.participants.forEach(p => {
            p.addTrasaction(txId);
        });
    }

    public voteCommit(p: Participant, txId: number) {
        let tx = this.transactions.get(txId);
        tx.addVoter(p);

        let allVoted = true;
        this.participants.forEach(pa => {
            if (!tx.getVoters().contains(pa)) {
                allVoted = false;
            }
        });

        if (allVoted) {
            tx.toCommit();
            this.participants.forEach(p1 => {
                p1.globalCommit(txId);
            });
        }
    }

    public voteAbort(p: Participant, txId: number) {
        let tx = this.transactions.get(txId);
        tx.toAbort();
        this.participants.forEach(p1 => {
            p1.globalAbort(txId);
        });
    }

    public async wait(txId: number) {
        let tx = this.transactions.get(txId);
        await tx.wait();
    }

    public getParticipants() {
        return this.participants;
    }

    public getTransactions() {
        return this.transactions;
    }

    transactionTimeout(tx: Transaction) {
        tx.toAbort();
        this.participants.forEach(p1 => {
            p1.globalAbort(tx.id);
        });
    }
}
