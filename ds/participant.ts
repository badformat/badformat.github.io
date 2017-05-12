import { Coordinator } from './coordinator';
import { IState, ITransaction } from './transaction';

class ParticipantTransaction implements ITransaction {
    public timeout = 5;

    private state: ParticipantTxState;
    private intervalId = 0;

    constructor(public readonly txId: number, private coordinator: Coordinator, private owner: Participant) {
        this.state = new ParticipantTxInitState(this);
        this.intervalId = setInterval(() => this.schedule(), 1000);
    }

    schedule() {
        if (this.isShutdown()) {
            return;
        }
        if (this.isCommited() || this.isAbort()) {
            clearInterval(this.intervalId);
            return;
        }
        this.timeout--;
        if (this.timeout <= 0) {
            clearInterval(this.intervalId);
            this.voteAbort();
        }
    }

    public getState(): IState {
        return this.state;
    }

    changeState(state: ParticipantTxInitState): void {
        this.state = state;
    }

    voteRequest(): void {
        this.state.onVoteRequest();
    }

    globalCommit(): void {
        if (this.isShutdown()) {
            return;
        }
        this.state.onGlobalCommit();
    }

    globalAbort(): void {
        if (this.isShutdown()) {
            return;
        }

        this.state.onGlobalAbort();
    }

    commit(): void { }

    voteCommit(): void {
        this.coordinator.participantVoteTx(this.owner, this.txId);
    }

    voteAbort(): void {
        this.coordinator.participantAbortTx(this.owner, this.txId);
    }

    canCommit(): boolean {
        return this.owner.canCommit(this.txId);
    }

    isShutdown(): boolean {
        return this.owner.isShutdown();
    }

    isCommited(): boolean {
        return this.state instanceof ParticipantTxCommitState;
    }

    isAbort(): boolean {
        return this.state instanceof ParticipantTxAbortState;
    }

    isInit(): boolean {
        return this.state instanceof ParticipantTxInitState;
    }

    recover(): void {
        for (let p of this.coordinator.getParticipants()) {
            if (p !== this.owner) {
                let tx = p.getTransaction(this.txId);
                if (tx != null && tx.isCommited()) {
                    this.voteCommit();
                    return;
                }
                if (tx != null && (tx.isAbort() || tx.isInit())) {
                    this.voteAbort();
                    return;
                }
                if (tx != null) {
                    this.voteRequest();
                    return;
                }
            }
        }
    }
}

abstract class ParticipantTxState implements IState {
    constructor(protected transaction: ParticipantTransaction) { };

    public abstract getName(): String;

    public onVoteRequest(): void {
        throw Error(this.getName() + "无法接收消息vote request");
    }

    public onGlobalAbort(): void {
        throw Error(this.getName() + "无法接收消息global abort");
    }

    public onGlobalCommit(): void {
        throw Error(this.getName() + "无法接收消息global commit");
    }
}

class ParticipantTxInitState extends ParticipantTxState {
    public getName(): String {
        return 'Init';
    }

    public onVoteRequest(): void {
        if (this.transaction.isShutdown()) {
            return;
        }
        if (this.transaction.canCommit()) {
            this.transaction.changeState(new ParticipantTxReadyState(this.transaction));
            this.transaction.voteCommit();
        } else {
            this.transaction.changeState(new ParticipantTxAbortState(this.transaction));
            this.transaction.voteAbort();
        }
    }

    public onGlobalAbort() {
        this.transaction.changeState(new ParticipantTxAbortState(this.transaction));
    }
}

class ParticipantTxAbortState extends ParticipantTxState {
    public getName(): String {
        return 'Abort';
    }

    public onGlobalAbort() {

    }
}

class ParticipantTxReadyState extends ParticipantTxState {
    public getName(): String {
        return 'Ready';
    }

    public onGlobalAbort(): void {
        this.transaction.changeState(new ParticipantTxAbortState(this.transaction));
    }

    public onGlobalCommit(): void {
        this.transaction.changeState(new ParticipantTxCommitState(this.transaction));
    }
}

class ParticipantTxCommitState extends ParticipantTxState {
    public getName(): String {
        return 'Commit';
    }
}

export class Participant {
    private transactions: ParticipantTransaction[] = [];
    private shuttedDown: boolean = false;

    constructor(public name: String, private coordinator: Coordinator) {
        coordinator.addParticipant(this);
    };

    public startTransaction(txId: number): void {
        this.transactions.push(new ParticipantTransaction(txId, this.coordinator, this));
    }

    public getTransactions(): ParticipantTransaction[] {
        return this.transactions;
    }

    public getTransaction(txId: number): ParticipantTransaction {
        for (let tx of this.transactions) {
            if (tx.txId === txId) {
                return tx;
            }
        }
        return null;
    }

    public voteRequestFor(txId: number): void {
        if (this.isShutdown()) {
            return;
        }
        let tx = new ParticipantTransaction(txId, this.coordinator, this);
        this.transactions.push(tx);
        tx.voteRequest();
    }

    public globalCommit(txId: number): void {
        if (this.isShutdown()) {
            return;
        }
        for (let tx of this.transactions) {
            if (tx.txId === txId) {
                tx.globalCommit();
            }
        }
    }

    public globalAbort(txId: number): void {
        if (this.isShutdown()) {
            return;
        }
        for (let tx of this.transactions) {
            if (tx.txId === txId) {
                tx.globalAbort();
            }
        }
    }

    public canCommit(txId: number): boolean {
        return true;
    }

    public shutdown(): void {
        this.shuttedDown = true;
    }

    public isShutdown(): boolean {
        return this.shuttedDown;
    }

    public recover(): void {
        this.shuttedDown = false;
        for (let tx of this.transactions) {
            tx.recover();
        }
    }

    public clearTransactions() {
        this.transactions = [];
    }
}
