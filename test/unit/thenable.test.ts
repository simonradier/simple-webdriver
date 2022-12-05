/*import { PromiseQueuable } from "../../src/thenable/promise-queuable"

describe('test', function (){
    it('should work', async function() {
        let test = new PromiseQueuable<number>();
        let time = Date.now();
        test.timeout(1000, 30).timeout(2000,20).timeout(3000,10).then((param) => {
            console.log("last result is : " , param);
            console.log("total duration is : " , (Date.now() - time) / 1000);
            console.log("end");
        });

        let result : string = await test.timeout(500, 42).timeout(100, 0).timeout(3000, 142);
        console.log(result);

    });
});*/
