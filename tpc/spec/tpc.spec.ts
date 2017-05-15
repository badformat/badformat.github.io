import { Coordinator } from '../coordinator';
import { Participant } from '../participant';

import { Set } from 'immutable';

describe('参与者、协调者交互', () => {
    let co: Coordinator;
    let p1: Participant;
    let p2: Participant;
    let p3: Participant;

    let ps: Set<Participant>;

    beforeEach(() => {
        co = new Coordinator();
        p1 = new Participant('p1', co);
        p2 = new Participant('p2', co);
        p3 = new Participant('p3', co);
        ps = Set<Participant>().add(p1).add(p2).add(p3);
    });

    test('协同者包含所有参与者', () => {
        ps.forEach(p => {
            expect(co.getParticipants().contains(p)).toBeTruthy();
        });
    });

    test('参与者知道协同者和其他参与者', () => {
        ps.forEach(p => {
            expect(p.co).not.toBeNull();
            expect(p.getTransactions().size).toBe(0);
            expect(p.getOthers().size).toBe(2);
            expect(p.getOthers().contains(p)).toBeFalsy();
        });
    });

    test('提交事务请求，各方各自事务进入Init状态', () => {
        let txId = 1;
        let tx = co.addTransactionWithDefaultTimeout(txId);
        expect(tx.getState()).toEqual('Init');
        co.startVote(txId);
        ps.forEach(p => {
            expect(p.getTransactions().get(txId).getState()).toEqual('Init');
        });
    });

    test('提交事务请求，协同者发起提交投票进入Wait状态，参与者等待决策', () => {
        let txId = 1;
        let tx = co.addTransactionWithDefaultTimeout(txId);
        co.startVote(txId);
        expect(tx.getState()).toEqual('Wait');
        ps.forEach(p => {
            expect(p.getTransactions().get(txId).getState()).toEqual('Init');
        });
    });

    test('提交事务请求，协同者发起提交投票，参与者全部投票同意', () => {
        let txId = 1;
        let tx = co.addTransactionWithDefaultTimeout(txId);
        co.startVote(txId);
        expect(tx.getState()).toEqual('Wait');
        ps.forEach(p => {
            p.voteCommit(txId);
        });

        expect(tx.getState()).toEqual('Commit');

        ps.forEach(p => {
            expect(p.getTransactions().get(txId).getState()).toEqual('Commit');
        });
    });

    test('提交事务请求，协同者发起提交投票，参与者随机顺序全部投票同意', () => {
        let txId = 1;
        let tx = co.addTransactionWithDefaultTimeout(txId);
        co.startVote(txId);
        expect(tx.getState()).toEqual('Wait');

        p2.voteCommit(txId);
        p1.voteCommit(txId);
        p3.voteCommit(txId);

        expect(tx.getState()).toEqual('Commit');

        ps.forEach(p => {
            expect(p.getTransactions().get(txId).getState()).toEqual('Commit');
        });
    });

    test('提交事务请求，某参与者投票中止', () => {
        let txId = 1;
        let tx = co.addTransactionWithDefaultTimeout(txId);

        co.startVote(txId);
        expect(tx.getState()).toEqual('Wait');

        let rejector = ps.toArray()[0];

        rejector.voteAbort(txId);

        ps.forEach(p => {
            expect(p.getTransactions().get(txId).getState()).toEqual('Abort');
        });

        expect(tx.getState()).toEqual('Abort');
    });

    test('提交事务请求，某参与者投票超时，事物中止', async () => {
        let txId = 1;
        let tx = co.addTransaction(txId, 2);

        co.startVote(txId);

        let timeout = ps.toArray()[0];

        let others = ps.remove(timeout);

        others.forEach(p => {
            p.voteCommit(txId);
        });

        await co.wait(txId); // if the transaction is in the state of 'Wait', wait until timeout.

        expect(tx.getState()).toEqual('Abort');

        ps.forEach(p => {
            expect(p.getTransactions().get(txId).getState()).toEqual('Abort');
        });
    });

    test('发起投票，某参与者断开未参与投票，事务取消', async () => {
        let txId = 1;
        let tx = co.addTransaction(txId, 2);

        co.startVote(txId);

        let leave = ps.toArray()[1];
        leave.disconnect();

        ps.forEach(p => {
            p.voteCommit(txId);

        });

        await co.wait(txId);
        expect(tx.getState()).toEqual('Abort');

        ps.forEach(async p => {
            await p.wait(txId);
            expect(p.getTransactions().get(txId).getState()).toEqual('Abort');
        });
    });

    test('发起投票，某参与者投票后断开，事务成功', async () => {
        let txId = 1;
        let tx = co.addTransaction(txId, 2);

        co.startVote(txId);

        let leave = ps.toArray()[1];

        ps.forEach(p => {
            p.voteCommit(txId);
            if (p === leave) {
                leave.disconnect();
            }
        });

        await co.wait(txId);
        expect(tx.getState()).toEqual('Commit');

        ps.forEach(async p => {
            await p.wait(txId);
            expect(p.getTransactions().get(txId).getState()).toEqual('Commit');
        });
    });
});
