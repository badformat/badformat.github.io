import { Coordinator } from './coordinator';
import { Participant } from './participant';

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
            co.addTransaction(txId, 10);
            txId++;
        }
    }
});
