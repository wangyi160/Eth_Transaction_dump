
// @flow

'use strict';

const level = require('level');
const fs = require('fs');  

const { decodeKey, decodeTx, decodeReceipt } = require('./decode');

// replace your chainstate path here.
const db = level('C:/geth/data2/geth/chaindata2', 
    { keyEncoding: 'hex', valueEncoding: 'binary' });

// 数据缓存表
let txs=[];
let receipts=[];

txs.push([]);
receipts.push([]);

// merge数据的时候作为锁的作用，防止并发merge两次
let mergeCount=-1;



// slotSize表示txs或receipts的每个slot中缓存的个数，实验表明太大的话会消耗太多内存
const slotSize=10;

// 因为txs和receipts的读取不同速，因此需要在读取到一定的数量后停止等待另一个，否则内存消耗会不断增大
// readSize表示本次从数据库中读取的条目数
const readSize = 10000;

//作为锁的作用， 当本次数据库读取结束后，需要做一次处理，防止并发处理两次
let readed = -1


function readTxDb(startN, endN)
{
    
    let start = "62"+toHex(startN)
    let end = "62"+toHex(endN)

    const rr = db.createReadStream({ gte: start, lt: end });

    rr.on('data', onData);
    rr.on('error', function (err) {
        console.log('Oh my!', err)
    });
    rr.on('close', function () {
        // console.log('Stream closed');
                
    });
    rr.on('end', function () {
        console.log('Stream ended');

        // console.log(txCount);
        // console.log(txs);

        console.log("receipts.length: "+receipts.length+"vs txs.length:"+txs.length)
        console.log("last receipt's.length: "+receipts[receipts.length-1].length+"vs last txs's length:"+txs[txs.length-1].length)
    

        if(receipts.length==txs.length && receipts[txs.length-1].length==txs[txs.length-1].length )
        {
            dataEnd()
        }
        else
        {
            console.log('Stream no operation');
        }

        
    });
}

function readReceiptDb(startN, endN)
{
    
    let start = "72"+toHex(startN)
    let end = "72"+toHex(endN)

    const rr = db.createReadStream({ gte: start, lt: end });

    rr.on('data', onData2);
    rr.on('error', function (err) {
        console.log('Oh my2!', err)
    });
    rr.on('close', function () {
        // console.log('Stream2 closed');
                
    });
    rr.on('end', function () {
        console.log('Stream2 ended');

        // console.log(receiptCount);
        // console.log(receipts);

        console.log("receipts.length: "+receipts.length+"vs txs.length:"+txs.length)
        console.log("last receipt's.length: "+receipts[receipts.length-1].length+"vs last txs's length:"+txs[txs.length-1].length)
    

        if(receipts.length==txs.length && txs[txs.length-1].length==receipts[receipts.length-1].length )
        {
            dataEnd()
        }
        else
        {
            console.log('Stream2 no operation');
        }
    });
}

function dataEnd()
{

    if(readed >= endNum)
        return

    readed=endNum

    if(txs[txs.length-1].length>0)
        mergeTxAndClean(txs.length-1);

    console.log(endNum+"vs"+limit)

    if(endNum<limit)
    {
        // 重新下一轮的读取
        startNum=endNum;
        endNum=startNum+readSize;

        console.log(startNum+"-"+endNum)

        readTxDb(startNum, endNum)
        readReceiptDb(startNum, endNum)
    }
    else
    {
        // 将最后的文件后面附上]
        if(buf.length>0)
        {
            buf+="]";
            fs.appendFileSync("json/out"+fileNo+".csv", buf, fscallback);
        }
    }
    
}

async function onData(data)
{
    try {
        

        let block = decodeKey(data.key);
        let transactions = decodeTx(data.value);

        if(transactions.length>0)
        {
            let i=0;
            for(i=0;i<transactions.length;i++)
            {
                let tx = Object.assign({}, block);
                tx = Object.assign(tx, transactions[i]);

                txs[txs.length-1].push(tx);
                
                if(txs[txs.length-1].length>=slotSize)
                {
                    // 如果receipts的对应的index的长度达标了，合并两者
                    if(receipts.length>=txs.length && receipts[txs.length-1].length>=slotSize)
                    {
                        mergeTxAndClean(txs.length-1);
                    }

                    txs.push([]);
                    
                }

            }
        }

    }
    catch(e)
    {
        console.log(e.message);
    }
}

async function onData2(data)
{
    try {
        // console.log(data.key+":"+data.value);
        // console.log("/////////////////////////////////////////////////////");

        // console.log(decodeKey(data.key));
        // console.log(decodeReceipt(data.value));

        let block = decodeKey(data.key);
        let res = decodeReceipt(data.value);

        if(res.length>0)
        {
            let i=0;
            for(i=0;i<res.length;i++)
            {
                let re = Object.assign({}, block);
                re = Object.assign(re, res[i]);

                receipts[receipts.length-1].push(re);
                
                if(receipts[receipts.length-1].length>=slotSize)
                {
                    // 如果txs的对应的index的长度达标了，合并两者
                    if(txs.length>=receipts.length && txs[receipts.length-1].length>=slotSize)
                    {
                        mergeTxAndClean(receipts.length-1);
                    }

                    receipts.push([]);
                    
                }
            }
        }

    }
    catch(e)
    {
        console.log(e.message);
    }
}

let buf="";

function mergeTxAndClean(index: number)
{
    // 检查是否已经merge过了
    if(mergeCount>=index)
        return;

    mergeCount=index;

    let i=0;
    for(i=0;i<txs[index].length;i++)
    {
        txs[index][i] = Object.assign(txs[index][i], receipts[index][i]);
    }

    

    if(buf.length==0)
    {
                
        let subbuf=JSON.stringify(txs[index]);
        buf+=subbuf.substring(0, subbuf.length-1);

        // fs.writeFileSync("json/out"+fileNo+".csv", buf, fscallback);
    }
    else
    {
                               
        let subbuf=JSON.stringify(txs[index]);
        buf+=",\n";
        buf+=subbuf.substring(1, subbuf.length-1);
                
    }

    // 缓存超过10M，写文件，清内存
    if(buf.length>10000000)
    {
        buf+="]";
        
        
        fs.writeFile("json/out"+fileNo+".csv", buf, fscallback);
        fileNo++;

        buf="";
    }

    
    // 清空内存
    txs[index]=[];
    receipts[index]=[];
    
}

function fscallback(err) {}

function toHex(num)
{
    let hex = num.toString(16);

    let ret=hex
    if(hex.length < 16)
    {

        for(let i=0;i<16-hex.length;i++)
        {
            ret = "0"+ret
        }
    }

    return ret.toUpperCase()
}

// 开始的条目
let startNum = 0 
let endNum = startNum+readSize

// 最大的条目
const limit =5500000;

// 由于可能不是一次性的读取所有的数据，因此给一个起始的文件编号，下次从该文件号输出
let fileNo=0;

console.log(startNum+"-"+endNum)

readTxDb(startNum, endNum);
readReceiptDb(startNum, endNum);



