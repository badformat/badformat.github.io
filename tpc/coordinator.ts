import { Participant } from './participant';
import { ITransaction } from './transaction';

import { Map, List } from 'immutable';

class Transaction implements ITransaction {
    private state = 'Init';
    private voters: List<Participant> = List<Participant>();
    constructor(public readonly id: number, public readonly co: Coordinator) { };

    public getState() {
        return this.state;
    }

    toWait() {
        this.state = 'Wait';
    }

    toCommit() {
        this.state = 'Commit';
    }

    addVoter(p: Participant) {
        this.voters = this.voters.push(p);
    }

    getVoters() {
        return this.voters;
    }
}

export class Coordinator {
    private participants: List<Participant> = List<Participant>();
    private transactions: Map<number, Transaction> = Map<number, Transaction>();

    public addTrasaction(id: number): Transaction {
        let tx = new Transaction(id, this);
        this.transactions = this.transactions.set(id, tx);

        this.participants.forEach(p => {
            p.addTrasaction(id);
        });

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
    }

    public voteCommit(p: Participant, txId: number) {
        let tx = this.transactions.get(txId);
        tx.addVoter(p);
        if (tx.getVoters().equals(this.participants)) {
            tx.toCommit();
            this.participants.forEach(p => {
                p.globalCommit(txId);
            });
        }
    }

    public getParticipants() {
        return this.participants;
    }
}
