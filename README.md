
How it works


The official eth client geth (<=1.18.x) (https://github.com/ethereum/go-ethereum) store transaction and receipt information in data/geth/chaindata (for testnet) . This chainstate folder contains leveldb files, eth_transaction_dump read and parse data from leveldb and write the result into multiple json files (10M every file). Use mongoimport to import data files into mongodb.


------------------------------------------------------------------------------------------------------

How to use it

It use flow (https://flow.org/) as the type checker for nodejs as it is a good habbit to write js program with typed style. Although it may not be necessary for this small project, but I follow the good pratice.

0. stop geth

because leveldb cannot be accessed by multiple clients, so you have to stop geth to read chainstate. Yes, it just make a dump for a snapshot of the blockchain. But it provides a quick and good foundation if you need real time transaction information later by processing through geth rpc service.

1. yarn install

install the node modules needed for the project

2. make directory json

json folder contains the generated json files (out*.json)

3. make directory lib

lib folder contains the js files for running

4. modify the parameter in src/index.js

replace your chainstate path here in line 12

    const db = level('C:/geth/data2/geth/chaindata2', 
    { keyEncoding: 'hex', valueEncoding: 'binary' });

modify startNum in line 307
    let startNum = 0

modify limit in line 311
    const limit =5500000;

modify fileNo in line 314
    let fileNo=0;

5. yarn run flow

check the type annotation in src/* files

6. yarn run build

generate runnable js files in lib folder

7. node lib/index.js

start read data from leveldb in chainstate folder, generate json files in json folder, it takes a while to finish. For testnet, there are about 5000000 entries at this time ( 2019.07.03 ), which will generate 40G multiple files. 


------------------------------------------------------------------------------------------------------









