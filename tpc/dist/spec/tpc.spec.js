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
define(["require", "exports", "../coordinator", "../participant", "immutable"], function (require, exports, coordinator_1, participant_1, immutable_1) {
    "use strict";
    var _this = this;
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('参与者、协调者交互', function () {
        var co;
        var p1;
        var p2;
        var p3;
        var ps;
        beforeEach(function () {
            co = new coordinator_1.Coordinator();
            p1 = new participant_1.Participant('p1', co);
            p2 = new participant_1.Participant('p2', co);
            p3 = new participant_1.Participant('p3', co);
            ps = immutable_1.Set().add(p1).add(p2).add(p3);
        });
        test('协同者包含所有参与者', function () {
            ps.forEach(function (p) {
                expect(co.getParticipants().contains(p)).toBeTruthy();
            });
        });
        test('参与者知道协同者和其他参与者', function () {
            ps.forEach(function (p) {
                expect(p.co).not.toBeNull();
                expect(p.getTransactions().size).toBe(0);
                expect(p.getOthers().size).toBe(2);
                expect(p.getOthers().contains(p)).toBeFalsy();
            });
        });
        test('提交事务请求，各方各自事务进入Init状态', function () {
            var txId = 1;
            var tx = co.addTransactionWithDefaultTimeout(txId);
            expect(tx.getState()).toEqual('Init');
            co.startVote(txId);
            ps.forEach(function (p) {
                expect(p.getTransactions().get(txId).getState()).toEqual('Init');
            });
        });
        test('提交事务请求，协同者发起提交投票进入Wait状态，参与者等待决策', function () {
            var txId = 1;
            var tx = co.addTransactionWithDefaultTimeout(txId);
            co.startVote(txId);
            expect(tx.getState()).toEqual('Wait');
            ps.forEach(function (p) {
                expect(p.getTransactions().get(txId).getState()).toEqual('Init');
            });
        });
        test('提交事务请求，协同者发起提交投票，参与者全部投票同意', function () {
            var txId = 1;
            var tx = co.addTransactionWithDefaultTimeout(txId);
            co.startVote(txId);
            expect(tx.getState()).toEqual('Wait');
            ps.forEach(function (p) {
                p.voteCommit(txId);
            });
            expect(tx.getState()).toEqual('Commit');
            ps.forEach(function (p) {
                expect(p.getTransactions().get(txId).getState()).toEqual('Commit');
            });
        });
        test('提交事务请求，协同者发起提交投票，参与者随机顺序全部投票同意', function () {
            var txId = 1;
            var tx = co.addTransactionWithDefaultTimeout(txId);
            co.startVote(txId);
            expect(tx.getState()).toEqual('Wait');
            p2.voteCommit(txId);
            p1.voteCommit(txId);
            p3.voteCommit(txId);
            expect(tx.getState()).toEqual('Commit');
            ps.forEach(function (p) {
                expect(p.getTransactions().get(txId).getState()).toEqual('Commit');
            });
        });
        test('提交事务请求，某参与者投票中止', function () {
            var txId = 1;
            var tx = co.addTransactionWithDefaultTimeout(txId);
            co.startVote(txId);
            expect(tx.getState()).toEqual('Wait');
            var rejector = ps.toArray()[0];
            rejector.voteAbort(txId);
            ps.forEach(function (p) {
                expect(p.getTransactions().get(txId).getState()).toEqual('Abort');
            });
            expect(tx.getState()).toEqual('Abort');
        });
        test('提交事务请求，某参与者投票超时，事物中止', function () { return __awaiter(_this, void 0, void 0, function () {
            var txId, tx, timeout, others;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        txId = 1;
                        tx = co.addTransaction(txId, 2);
                        co.startVote(txId);
                        timeout = ps.toArray()[0];
                        others = ps.remove(timeout);
                        others.forEach(function (p) {
                            p.voteCommit(txId);
                        });
                        return [4 /*yield*/, co.wait(txId)];
                    case 1:
                        _a.sent(); // if the transaction is in the state of 'Wait', wait until timeout.
                        expect(tx.getState()).toEqual('Abort');
                        ps.forEach(function (p) {
                            expect(p.getTransactions().get(txId).getState()).toEqual('Abort');
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        test('发起投票，某参与者断开未参与投票，事务取消', function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            var txId, tx, leave;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        txId = 1;
                        tx = co.addTransaction(txId, 2);
                        co.startVote(txId);
                        leave = ps.toArray()[1];
                        leave.disconnect();
                        ps.forEach(function (p) {
                            p.voteCommit(txId);
                        });
                        return [4 /*yield*/, co.wait(txId)];
                    case 1:
                        _a.sent();
                        expect(tx.getState()).toEqual('Abort');
                        ps.forEach(function (p) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, p.wait(txId)];
                                    case 1:
                                        _a.sent();
                                        expect(p.getTransactions().get(txId).getState()).toEqual('Abort');
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                }
            });
        }); });
        test('发起投票，某参与者投票后断开，事务成功', function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            var txId, tx, leave;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        txId = 1;
                        tx = co.addTransaction(txId, 2);
                        co.startVote(txId);
                        leave = ps.toArray()[1];
                        ps.forEach(function (p) {
                            p.voteCommit(txId);
                            if (p === leave) {
                                leave.disconnect();
                            }
                        });
                        return [4 /*yield*/, co.wait(txId)];
                    case 1:
                        _a.sent();
                        expect(tx.getState()).toEqual('Commit');
                        ps.forEach(function (p) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, p.wait(txId)];
                                    case 1:
                                        _a.sent();
                                        expect(p.getTransactions().get(txId).getState()).toEqual('Commit');
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=tpc.spec.js.map