import { Coordinator } from './coordinator';
import { Participant } from './participant';

// let c = new Coordinator();
// let p1 = new Participant("p1", c);
// let p2 = new Participant("p2", c);
// let p3 = new Participant("p3", c);

// function log() {
//     console.log('---------------------------------');
//     for (let tx of c.getTransactions()) {
//         console.log('协作者事务' + tx.txId + '状态：' + tx.getState().getName() + '。');
//     }

//     for (let p of c.getParticipants()) {

//         for (let tx of p.getTransactions()) {
//             console.log('参与者' + p.name + '事务' + tx.txId + '状态：' + tx.getState().getName() + '。');
//         }
//     }
// }

// c.startTransaction(1);
// log();

// c.clearTransactions();
// p1.shutdown();
// c.startTransaction(2);
// log();
// console.log('恢复p1');
// p1.recover();
// log();

// c.clearTransactions();
// p1.shutdown();
// p2.shutdown();
// c.startTransaction(2);
// log();
// console.log('恢复p1');
// p1.recover();
// log();
// console.log('恢复p2');
// p2.recover();
// log();

declare let Vue: any;
let txId = 1;

let co = new Coordinator();
let p1 = new Participant("p1", co);
let p2 = new Participant("p2", co);
let p3 = new Participant("p3", co);

let app = new Vue({
    el: '#tpc',
    data: {
        co: co,
        p1: p1,
        p2: p2,
        p3: p3
    },
    methods: {
        submitTx: function () {
            co.startTransaction(txId);
            txId++;
        }
    }
});
