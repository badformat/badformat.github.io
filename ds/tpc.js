var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define("transaction", ["require", "exports"], function (require, exports) {
    "use strict";
    ;
});
define("participant", ["require", "exports"], function (require, exports) {
    "use strict";
    var ParticipantTransaction = (function () {
        function ParticipantTransaction(txId, coordinator, owner) {
            var _this = this;
            this.txId = txId;
            this.coordinator = coordinator;
            this.owner = owner;
            this.timeout = 5;
            this.intervalId = 0;
            this.state = new ParticipantTxInitState(this);
            this.intervalId = setInterval(function () { return _this.schedule(); }, 1000);
        }
        ParticipantTransaction.prototype.schedule = function () {
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
        };
        ParticipantTransaction.prototype.getState = function () {
            return this.state;
        };
        ParticipantTransaction.prototype.changeState = function (state) {
            this.state = state;
        };
        ParticipantTransaction.prototype.voteRequest = function () {
            this.state.onVoteRequest();
        };
        ParticipantTransaction.prototype.globalCommit = function () {
            if (this.isShutdown()) {
                return;
            }
            this.state.onGlobalCommit();
        };
        ParticipantTransaction.prototype.globalAbort = function () {
            if (this.isShutdown()) {
                return;
            }
            this.state.onGlobalAbort();
        };
        ParticipantTransaction.prototype.commit = function () { };
        ParticipantTransaction.prototype.voteCommit = function () {
            this.coordinator.participantVoteTx(this.owner, this.txId);
        };
        ParticipantTransaction.prototype.voteAbort = function () {
            this.coordinator.participantAbortTx(this.owner, this.txId);
        };
        ParticipantTransaction.prototype.canCommit = function () {
            return this.owner.canCommit(this.txId);
        };
        ParticipantTransaction.prototype.isShutdown = function () {
            return this.owner.isShutdown();
        };
        ParticipantTransaction.prototype.isCommited = function () {
            return this.state instanceof ParticipantTxCommitState;
        };
        ParticipantTransaction.prototype.isAbort = function () {
            return this.state instanceof ParticipantTxAbortState;
        };
        ParticipantTransaction.prototype.isInit = function () {
            return this.state instanceof ParticipantTxInitState;
        };
        ParticipantTransaction.prototype.recover = function () {
            for (var _i = 0, _a = this.coordinator.getParticipants(); _i < _a.length; _i++) {
                var p = _a[_i];
                if (p !== this.owner) {
                    var tx = p.getTransaction(this.txId);
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
        };
        return ParticipantTransaction;
    }());
    var ParticipantTxState = (function () {
        function ParticipantTxState(transaction) {
            this.transaction = transaction;
        }
        ;
        ParticipantTxState.prototype.onVoteRequest = function () {
            throw Error(this.getName() + "无法接收消息vote request");
        };
        ParticipantTxState.prototype.onGlobalAbort = function () {
            throw Error(this.getName() + "无法接收消息global abort");
        };
        ParticipantTxState.prototype.onGlobalCommit = function () {
            throw Error(this.getName() + "无法接收消息global commit");
        };
        return ParticipantTxState;
    }());
    var ParticipantTxInitState = (function (_super) {
        __extends(ParticipantTxInitState, _super);
        function ParticipantTxInitState() {
            return _super.apply(this, arguments) || this;
        }
        ParticipantTxInitState.prototype.getName = function () {
            return 'Init';
        };
        ParticipantTxInitState.prototype.onVoteRequest = function () {
            if (this.transaction.isShutdown()) {
                return;
            }
            if (this.transaction.canCommit()) {
                this.transaction.changeState(new ParticipantTxReadyState(this.transaction));
                this.transaction.voteCommit();
            }
            else {
                this.transaction.changeState(new ParticipantTxAbortState(this.transaction));
                this.transaction.voteAbort();
            }
        };
        ParticipantTxInitState.prototype.onGlobalAbort = function () {
            this.transaction.changeState(new ParticipantTxAbortState(this.transaction));
        };
        return ParticipantTxInitState;
    }(ParticipantTxState));
    var ParticipantTxAbortState = (function (_super) {
        __extends(ParticipantTxAbortState, _super);
        function ParticipantTxAbortState() {
            return _super.apply(this, arguments) || this;
        }
        ParticipantTxAbortState.prototype.getName = function () {
            return 'Abort';
        };
        ParticipantTxAbortState.prototype.onGlobalAbort = function () {
        };
        return ParticipantTxAbortState;
    }(ParticipantTxState));
    var ParticipantTxReadyState = (function (_super) {
        __extends(ParticipantTxReadyState, _super);
        function ParticipantTxReadyState() {
            return _super.apply(this, arguments) || this;
        }
        ParticipantTxReadyState.prototype.getName = function () {
            return 'Ready';
        };
        ParticipantTxReadyState.prototype.onGlobalAbort = function () {
            this.transaction.changeState(new ParticipantTxAbortState(this.transaction));
        };
        ParticipantTxReadyState.prototype.onGlobalCommit = function () {
            this.transaction.changeState(new ParticipantTxCommitState(this.transaction));
        };
        return ParticipantTxReadyState;
    }(ParticipantTxState));
    var ParticipantTxCommitState = (function (_super) {
        __extends(ParticipantTxCommitState, _super);
        function ParticipantTxCommitState() {
            return _super.apply(this, arguments) || this;
        }
        ParticipantTxCommitState.prototype.getName = function () {
            return 'Commit';
        };
        return ParticipantTxCommitState;
    }(ParticipantTxState));
    var Participant = (function () {
        function Participant(name, coordinator) {
            this.name = name;
            this.coordinator = coordinator;
            this.transactions = [];
            this.shuttedDown = false;
            coordinator.addParticipant(this);
        }
        ;
        Participant.prototype.startTransaction = function (txId) {
            this.transactions.push(new ParticipantTransaction(txId, this.coordinator, this));
        };
        Participant.prototype.getTransactions = function () {
            return this.transactions;
        };
        Participant.prototype.getTransaction = function (txId) {
            for (var _i = 0, _a = this.transactions; _i < _a.length; _i++) {
                var tx = _a[_i];
                if (tx.txId === txId) {
                    return tx;
                }
            }
            return null;
        };
        Participant.prototype.voteRequestFor = function (txId) {
            if (this.isShutdown()) {
                return;
            }
            var tx = new ParticipantTransaction(txId, this.coordinator, this);
            this.transactions.push(tx);
            tx.voteRequest();
        };
        Participant.prototype.globalCommit = function (txId) {
            if (this.isShutdown()) {
                return;
            }
            for (var _i = 0, _a = this.transactions; _i < _a.length; _i++) {
                var tx = _a[_i];
                if (tx.txId === txId) {
                    tx.globalCommit();
                }
            }
        };
        Participant.prototype.globalAbort = function (txId) {
            if (this.isShutdown()) {
                return;
            }
            for (var _i = 0, _a = this.transactions; _i < _a.length; _i++) {
                var tx = _a[_i];
                if (tx.txId === txId) {
                    tx.globalAbort();
                }
            }
        };
        Participant.prototype.canCommit = function (txId) {
            return true;
        };
        Participant.prototype.shutdown = function () {
            this.shuttedDown = true;
        };
        Participant.prototype.isShutdown = function () {
            return this.shuttedDown;
        };
        Participant.prototype.recover = function () {
            this.shuttedDown = false;
            for (var _i = 0, _a = this.transactions; _i < _a.length; _i++) {
                var tx = _a[_i];
                tx.recover();
            }
        };
        Participant.prototype.clearTransactions = function () {
            this.transactions = [];
        };
        return Participant;
    }());
    exports.Participant = Participant;
});
define("coordinator", ["require", "exports"], function (require, exports) {
    "use strict";
    var CoordinatorTxState = (function () {
        function CoordinatorTxState(transaction) {
            this.transaction = transaction;
            this.waitFor = [];
        }
        ;
        CoordinatorTxState.prototype.onVoteStart = function () {
            throw Error(this.getName() + "无法接收消息onVoteStart");
        };
        CoordinatorTxState.prototype.onVoteAbort = function (voter) {
            throw Error(this.getName() + "无法接收消息onVoteAbort");
        };
        CoordinatorTxState.prototype.onVoteCommit = function (voter) {
            throw Error(this.getName() + "无法接收消息onVoteCommit");
        };
        return CoordinatorTxState;
    }());
    var CoordinatorTxInitState = (function (_super) {
        __extends(CoordinatorTxInitState, _super);
        function CoordinatorTxInitState() {
            return _super.apply(this, arguments) || this;
        }
        CoordinatorTxInitState.prototype.getName = function () {
            return 'Init';
        };
        CoordinatorTxInitState.prototype.onVoteStart = function () {
            this.transaction.changeState(new CoordinatorTxWaitState(this.transaction));
            this.transaction.sendVoteRequest();
        };
        return CoordinatorTxInitState;
    }(CoordinatorTxState));
    var CoordinatorTxWaitState = (function (_super) {
        __extends(CoordinatorTxWaitState, _super);
        function CoordinatorTxWaitState(transaction) {
            var _this = _super.call(this, transaction) || this;
            _this.transaction = transaction;
            transaction.getParticipants().forEach(function (p) {
                _this.waitFor.push(p);
            });
            return _this;
        }
        CoordinatorTxWaitState.prototype.getName = function () {
            return 'Wait';
        };
        CoordinatorTxWaitState.prototype.onVoteAbort = function (voter) {
            if (this.waitFor.indexOf(voter) === -1) {
                return;
            }
            this.transaction.changeState(new CoordinatorTxAbortState(this.transaction));
            this.transaction.abort();
            return;
        };
        CoordinatorTxWaitState.prototype.onVoteCommit = function (voter) {
            if (this.waitFor.indexOf(voter) === -1) {
                throw Error("onVoteCommit:未知的参与者" + voter.name);
            }
            this.waitFor.splice(this.waitFor.indexOf(voter), 1);
            if (this.waitFor.length === 0) {
                this.transaction.changeState(new CoordinatorTxCommitState(this.transaction));
                this.transaction.commit();
            }
        };
        return CoordinatorTxWaitState;
    }(CoordinatorTxState));
    var CoordinatorTxAbortState = (function (_super) {
        __extends(CoordinatorTxAbortState, _super);
        function CoordinatorTxAbortState() {
            return _super.apply(this, arguments) || this;
        }
        CoordinatorTxAbortState.prototype.getName = function () {
            return 'Abort';
        };
        CoordinatorTxAbortState.prototype.onVoteAbort = function (voter) {
            for (var _i = 0, _a = this.transaction.getParticipants(); _i < _a.length; _i++) {
                var p = _a[_i];
                p.globalAbort(this.transaction.txId);
            }
        };
        return CoordinatorTxAbortState;
    }(CoordinatorTxState));
    var CoordinatorTxCommitState = (function (_super) {
        __extends(CoordinatorTxCommitState, _super);
        function CoordinatorTxCommitState() {
            return _super.apply(this, arguments) || this;
        }
        CoordinatorTxCommitState.prototype.getName = function () {
            return 'Commit';
        };
        CoordinatorTxCommitState.prototype.onVoteCommit = function (voter) {
        };
        return CoordinatorTxCommitState;
    }(CoordinatorTxState));
    var CoordinatorTransaction = (function () {
        function CoordinatorTransaction(txId, coordinator, participants) {
            this.txId = txId;
            this.coordinator = coordinator;
            this.participants = participants;
            this.timeout = 20;
            this.state = new CoordinatorTxInitState(this);
        }
        ;
        CoordinatorTransaction.prototype.getState = function () {
            return this.state;
        };
        CoordinatorTransaction.prototype.changeState = function (state) {
            this.state = state;
        };
        CoordinatorTransaction.prototype.getParticipants = function () {
            return this.participants;
        };
        CoordinatorTransaction.prototype.startVote = function () {
            this.state.onVoteStart();
        };
        CoordinatorTransaction.prototype.voteCommit = function (p) {
            this.state.onVoteCommit(p);
        };
        CoordinatorTransaction.prototype.voteAbort = function (p) {
            this.state.onVoteAbort(p);
        };
        CoordinatorTransaction.prototype.sendVoteRequest = function () {
            for (var _i = 0, _a = this.participants; _i < _a.length; _i++) {
                var p = _a[_i];
                p.voteRequestFor(this.txId);
            }
        };
        CoordinatorTransaction.prototype.commit = function () {
            for (var _i = 0, _a = this.participants; _i < _a.length; _i++) {
                var p = _a[_i];
                p.globalCommit(this.txId);
            }
        };
        CoordinatorTransaction.prototype.abort = function () {
            for (var _i = 0, _a = this.participants; _i < _a.length; _i++) {
                var p = _a[_i];
                p.globalAbort(this.txId);
            }
        };
        return CoordinatorTransaction;
    }());
    var Coordinator = (function () {
        function Coordinator() {
            this.transactions = [];
            this.participants = [];
        }
        Coordinator.prototype.startTransaction = function (txId) {
            var tx = new CoordinatorTransaction(txId, this, this.participants);
            this.transactions.push(tx);
            tx.startVote();
        };
        Coordinator.prototype.participantAbortTx = function (participant, txId) {
            for (var _i = 0, _a = this.transactions; _i < _a.length; _i++) {
                var tx = _a[_i];
                if (tx.txId === txId) {
                    tx.voteAbort(participant);
                }
            }
        };
        Coordinator.prototype.participantVoteTx = function (participant, txId) {
            for (var _i = 0, _a = this.transactions; _i < _a.length; _i++) {
                var tx = _a[_i];
                if (tx.txId === txId) {
                    tx.voteCommit(participant);
                }
            }
        };
        Coordinator.prototype.addParticipant = function (p) {
            this.participants.push(p);
        };
        Coordinator.prototype.getParticipants = function () {
            return this.participants;
        };
        Coordinator.prototype.getTransactions = function () {
            return this.transactions;
        };
        Coordinator.prototype.clearTransactions = function () {
            this.transactions = [];
            for (var _i = 0, _a = this.participants; _i < _a.length; _i++) {
                var p = _a[_i];
                p.clearTransactions();
            }
        };
        return Coordinator;
    }());
    exports.Coordinator = Coordinator;
});
define("tpc", ["require", "exports", "coordinator", "participant"], function (require, exports, coordinator_1, participant_1) {
    "use strict";
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
                co.startTransaction(txId);
                txId++;
            }
        }
    });
});
//# sourceMappingURL=tpc.js.map