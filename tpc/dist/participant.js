var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
define(["require", "exports", "immutable"], function (require, exports, immutable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Transaction = (function () {
        function Transaction(id, owner) {
            var _this = this;
            this.id = id;
            this.owner = owner;
            this.state = 'Init';
            this.timeoutSeconds = 10;
            this.ttl = 10;
            this.promise = new Promise(function (resolve) {
                setTimeout(function () { resolve(); _this.timeout(); }, _this.timeoutSeconds * 1000);
            });
            var intervalId = setInterval(function () {
                if (_this.state !== 'Wait' && _this.state !== 'Init') {
                    clearInterval(intervalId);
                }
                if (_this.ttl > 0) {
                    _this.ttl--;
                }
                else {
                    clearInterval(intervalId);
                }
            }, 1000);
        }
        ;
        Transaction.prototype.getState = function () {
            return this.state;
        };
        Transaction.prototype.getTTL = function () {
            return this.ttl;
        };
        Transaction.prototype.toReady = function () {
            this.state = 'Ready';
        };
        Transaction.prototype.toCommit = function () {
            this.state = 'Commit';
        };
        Transaction.prototype.toAbort = function () {
            this.state = 'Abort';
        };
        Transaction.prototype.wait = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.promise];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        Transaction.prototype.timeout = function () {
            if (this.state === 'Ready') {
                this.owner.transactionTimeout(this);
            }
        };
        return Transaction;
    }());
    var Participant = (function () {
        function Participant(name, co) {
            this.name = name;
            this.co = co;
            this.transactions = immutable_1.Map();
            this.others = immutable_1.List();
            this.disconnected = false;
            co.joinParticpant(this);
        }
        Participant.prototype.voteCommit = function (txId) {
            if (this.disconnected) {
                return;
            }
            var tx = this.transactions.get(txId);
            tx.toReady();
            this.co.voteCommit(this, txId);
        };
        Participant.prototype.voteAbort = function (txId) {
            if (this.disconnected) {
                return;
            }
            var tx = this.transactions.get(txId);
            tx.toAbort();
            this.co.voteAbort(this, txId);
        };
        Participant.prototype.globalCommit = function (txId) {
            if (this.disconnected) {
                return;
            }
            var tx = this.transactions.get(txId);
            tx.toCommit();
        };
        Participant.prototype.globalAbort = function (txId) {
            if (this.disconnected) {
                return;
            }
            var tx = this.transactions.get(txId);
            tx.toAbort();
        };
        Participant.prototype.updateOthers = function (others) {
            this.others = others.delete(others.indexOf(this));
        };
        Participant.prototype.getOthers = function () {
            return this.others;
        };
        Participant.prototype.addTrasaction = function (id) {
            this.transactions = this.transactions.set(id, new Transaction(id, this));
        };
        Participant.prototype.getTransactions = function () {
            return this.transactions;
        };
        Participant.prototype.disconnect = function () {
            this.disconnected = true;
        };
        Participant.prototype.isConnected = function () {
            return !this.disconnected;
        };
        Participant.prototype.reconnect = function () {
            var _this = this;
            this.disconnected = false;
            this.transactions.forEach(function (tx) {
                _this.determineTxState(tx);
            });
        };
        Participant.prototype.transactionTimeout = function (tx) {
            this.determineTxState(tx);
        };
        Participant.prototype.determineTxState = function (tx) {
            if (tx.getState() === 'Commit' || tx.getState() === 'Abort') {
                return;
            }
            this.others.forEach(function (p) {
                var ptx = p.getTransactions().get(tx.id);
                if (ptx.getState() === 'Commit') {
                    tx.toCommit();
                    return;
                }
                if (ptx.getState() === 'Abort') {
                    tx.toAbort();
                    return;
                }
                if (ptx.getState() === 'Init') {
                    tx.toAbort();
                }
            });
        };
        Participant.prototype.wait = function (txId) {
            return __awaiter(this, void 0, void 0, function () {
                var tx;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            tx = this.transactions.get(txId);
                            return [4 /*yield*/, tx.wait()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        return Participant;
    }());
    exports.Participant = Participant;
});
//# sourceMappingURL=participant.js.map