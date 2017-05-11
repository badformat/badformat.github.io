export interface IState {
    getName(): String;
};

export interface ITransaction {
    txId: number;
    timeout: number;
    getState(): IState;
}