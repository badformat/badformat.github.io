import { Participant } from './participant';
import { IState, ITransaction } from './transaction';

abstract class CoordinatorTxState implements IState {
    protected waitFor: Participant[] = [];

    constructor(protected transaction: CoordinatorTransaction) { };

    public abstract getName(): String;

    public onVoteStart(): void {
        throw Error(this.getName() + "无法接收消息onVoteStart");
    }

    public onVoteAbort(voter: Participant): void {
        throw Error(this.getName() + "无法接收消息onVoteAbort");
    }

    public onVoteCommit(voter: Participant): void {
        throw Error(this.getName() + "无法接收消息onVoteCommit");
    }

}

class CoordinatorTxInitState extends CoordinatorTxState {
    public getName(): String {
        return 'Init';
    }

    public onVoteStart(): void {
        this.transaction.changeState(new CoordinatorTxWaitState(this.transaction));
        this.transaction.sendVoteRequest();
    }
}

class CoordinatorTxWaitState extends CoordinatorTxState {
    public getName(): String {
        return 'Wait';
    }

    constructor(protected transaction: CoordinatorTransaction) {
        super(transaction);
        transaction.getParticipants().forEach(p => {
            this.waitFor.push(p);
        });
    }

    public onVoteAbort(voter: Participant): void {
        if (this.waitFor.indexOf(voter) === -1) {
            return;
        }
        this.transaction.changeState(new CoordinatorTxAbortState(this.transaction));
        this.transaction.abort();
        return;
    }

    public onVoteCommit(voter: Participant): void {
        if (this.waitFor.indexOf(voter) === -1) {
            throw Error("onVoteCommit:未知的参与者" + voter.name);
        }
        this.waitFor.splice(this.waitFor.indexOf(voter), 1);
        if (this.waitFor.length === 0) {
            this.transaction.changeState(new CoordinatorTxCommitState(this.transaction));
            this.transaction.commit();
        }
    }
}

class CoordinatorTxAbortState extends CoordinatorTxState {

    public getName(): String {
        return 'Abort';
    }

    public onVoteAbort(voter: Participant): void {
        for (let p of this.transaction.getParticipants()) {
            p.globalAbort(this.transaction.txId);
        }
    }
}

class CoordinatorTxCommitState extends CoordinatorTxState {

    public getName(): String {
        return 'Commit';
    }

    public onVoteCommit(voter: Participant): void {

    }
}

class CoordinatorTransaction implements ITransaction {
    public timeout = 20;
    private state: CoordinatorTxState;

    constructor(public readonly txId: number, private coordinator: Coordinator, private participants: Participant[]) {
        this.state = new CoordinatorTxInitState(this);
    };

    public getState(): IState {
        return this.state;
    }

    changeState(state: CoordinatorTxState): void {
        this.state = state;
    }

    getParticipants(): Participant[] {
        return this.participants;
    }

    startVote(): void {
        this.state.onVoteStart();
    }

    voteCommit(p: Participant): void {
        this.state.onVoteCommit(p);
    }

    voteAbort(p: Participant): void {
        this.state.onVoteAbort(p);
    }

    sendVoteRequest(): void {
        for (let p of this.participants) {
            p.voteRequestFor(this.txId);
        }
    }

    commit(): void {
        for (let p of this.participants) {
            p.globalCommit(this.txId);
        }
    }

    abort(): void {
        for (let p of this.participants) {
            p.globalAbort(this.txId);
        }
    }
}

export class Coordinator {
    private transactions: CoordinatorTransaction[] = [];
    private participants: Participant[] = [];

    public startTransaction(txId: number): void {
        let tx: CoordinatorTransaction = new CoordinatorTransaction(txId, this, this.participants);
        this.transactions.push(tx);
        tx.startVote();
    }

    public participantAbortTx(participant: Participant, txId: number): void {
        for (let tx of this.transactions) {
            if (tx.txId === txId) {
                tx.voteAbort(participant);
            }
        }
    }

    public participantVoteTx(participant: Participant, txId: number): void {
        for (let tx of this.transactions) {
            if (tx.txId === txId) {
                tx.voteCommit(participant);
            }
        }
    }

    public addParticipant(p: Participant): void {
        this.participants.push(p);
    }

    public getParticipants(): Participant[] {
        return this.participants;
    }

    public getTransactions(): ITransaction[] {
        return this.transactions;
    }

    public clearTransactions(): void {
        this.transactions = [];
        for (let p of this.participants) {
            p.clearTransactions();
        }
    }
}