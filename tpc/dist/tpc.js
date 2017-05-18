define(["require", "exports", "./coordinator", "./participant"], function (require, exports, coordinator_1, participant_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var txId = 1;
    var co = new coordinator_1.Coordinator();
    var p1 = new participant_1.Participant("p1", co);
    var p2 = new participant_1.Participant("p2", co);
    var p3 = new participant_1.Participant("p3", co);
    var app = new Vue({
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
});
//# sourceMappingURL=tpc.js.map