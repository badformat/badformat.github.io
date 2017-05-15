export interface ITransaction {
    id: number;
    getState(): String;
    getTTL(): number;
}
