/* export class PromiseQueuable<T> {

    protected _lastResult : any = null;
    
    protected _queue : Array<[func : (...args: any[]) => Promise<any>, param : any[]]> = new Array<[func : (...args : any []) => Promise<any>, param : any[]]>();
   
    
    private async _addToQueue(func : (...args: any[]) => Promise<any>, ...args : any[]) {
        this._queue.push([func, args]);

    }
    
    public then(onFulfilled?: (param : any) => void , onRejected?: (error: any) => void) : PromiseQueuable<T> {
        let call = async () => {
            try { 
                while (this._queue.length > 0) {
                    let [func, args] = this._queue[0];
                    this._lastResult = await func.apply(this, args)
                    this._queue.shift();
                }
                onFulfilled(this._lastResult);
            } catch (err) {
                onRejected(err);
            }
        }
        call();
        return this;
    }

    public timeout(value : number, result : number) : PromiseQueuable<T> {
        this._addToQueue(this.callTimeout, value, result)
        return this;
    }

    private callTimeout(value : number, result : number) {
        return new Promise<number>((resolve, reject) => {
            setTimeout(() => {
                resolve(result);
            }, value);
        })
    }
} */
