import { Coordinator } from './coordinator';
import { Participant } from './participant';

let co = new Coordinator();
let p1 = new Participant(co);
let p2 = new Participant(co);
let p3 = new Participant(co);

let txId = 1;

describe('', () => {
    co.startTx(txId);
});

