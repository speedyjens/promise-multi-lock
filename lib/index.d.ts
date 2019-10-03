interface LockData {
    queue: Array<() => void>;
    locked: boolean;
}
export declare class MultiLock {
    locks: {
        [index: string]: LockData;
    };
    constructor();
    lock(res: string): Promise<void>;
    unlock(res: string): void;
    destroy(res: string): void;
    is_locked(res: string): boolean;
}
export {};
