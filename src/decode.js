// @flow

'use strict';

var { bigNumberify } = require('ethers/utils/bignumber');
const RLP = require('ethers/utils/rlp');
var Transaction = require('ethereumjs-tx').Transaction;

type RawTransaction = {
    nonce: string,
    gasPrice: string,
    gasLimit: string,
    to: string,
    value: string,
    data: string,
    v: string,
    r: string,
    s: string
}

function decodeKey(key:string)
{
    let type = key.substring(0,2);
    let blockNumber = parseInt(key.substring(2, 18), 16);
    let blockHash = key.substring(18);

    
    return {blockNumber, blockHash};
}

function getFrom(rawTx: RawTransaction)
{

    let v = bigNumberify(rawTx.v).toNumber();
    
    let tx;

    if(v >= 35)
    {
        let opts = {
            chain: 4,
            hardfork: "spuriousDragon"
        };

        tx = new Transaction(rawTx, opts);
    }
    else
    {
        tx = new Transaction(rawTx);
    }

    let address = tx.getSenderAddress().toString('hex');
        
    return "0x"+address;
}

function parseBody(decoded_tx: Array<Array<Array<string>>>)
{
    let transactions=[];
    
    // [ [ [tx], [tx], ... ], [] ]
    if(decoded_tx[0].length>0)
    {
        let i=0;

        for(i=0;i<decoded_tx[0].length;i++)
        {
            // tx = [ 
            // raw_nonce,
            // raw_gasPrice,
            // raw_gasLimit,
            // raw_to,
            // raw_value,
            // raw_data,
            // raw_v,
            // raw_r,
            // raw_s  
            // ]

            let rawTx = {
                nonce: decoded_tx[0][i][0],
                gasPrice: decoded_tx[0][i][1],
                gasLimit: decoded_tx[0][i][2],
                to: decoded_tx[0][i][3],
                value: decoded_tx[0][i][4],
                data: decoded_tx[0][i][5],
                v: decoded_tx[0][i][6],
                r: decoded_tx[0][i][7],
                s: decoded_tx[0][i][8]
            };

            // console.log(rawTx);
                   
            let from = getFrom(rawTx);

            let nonce = bigNumberify(decoded_tx[0][i][0]).toNumber();
            let gasPrice = bigNumberify(decoded_tx[0][i][1]).toNumber();
            let gasLimit = bigNumberify(decoded_tx[0][i][2]).toNumber();
            let to = decoded_tx[0][i][3];
            let value = bigNumberify(decoded_tx[0][i][4]).toString();
            let data = decoded_tx[0][i][5];
            let v = bigNumberify(decoded_tx[0][i][6]).toNumber();
            let r = decoded_tx[0][i][7];
            let s = decoded_tx[0][i][8];
            
            let transaction = {nonce, gasPrice, gasLimit, to, value, data, v, r, s, from};
            transactions.push(transaction);

        }
    }
    
    return transactions;
}

function decodeTx(value: string)
{
    let decoded_tx = RLP.decode(value);
    let transactions = parseBody(decoded_tx);
    
    return transactions;
}

function parseReceipt(decoded_re: Array<Array<any>>)
{
    let receipts=[];
    
    // [ [ [tx], [tx], ... ], [] ]
    if(decoded_re.length>0)
    {
        let i=0;

        for(i=0;i<decoded_re.length;i++)
        {
            // receipt = [ 
            //     raw_postStateOrStatus, 
            //     raw_cumulativeGasUsed, 
            //     raw_bloom,
            //     raw_txHash,
            //     raw_contractAddress,
            //     raw_logs,
            //     raw_gasUsed
            // ]
            let postStateOrStatus = decoded_re[i][0];
            let cumulativeGasUsed = bigNumberify(decoded_re[i][1]).toNumber();
            let bloom = decoded_re[i][2];
            let txHash = decoded_re[i][3];
            let contractAddress = decoded_re[i][4];
            let logs = parseLog(decoded_re[i][5]);
            let gasUsed = bigNumberify(decoded_re[i][6]).toNumber();
            

            let receipt = {postStateOrStatus, cumulativeGasUsed, bloom, txHash, contractAddress, logs, gasUsed};
            receipts.push(receipt);

        }
    }
    
    return receipts;
}

function parseLog(decoded_log: Array<Array<string>> )
{
    let logs=[];
    
    // [ [ [tx], [tx], ... ], [] ]
    if(decoded_log.length>0)
    {
        let i=0;

        for(i=0;i<decoded_log.length;i++)
        {
            // log = [ 
            // Address     common.Address
            // Topics      []common.Hash
            // Data        []byte
            // BlockNumber uint64
            // TxHash      common.Hash
            // TxIndex     uint
            // BlockHash   common.Hash
            // Index       uint
            // ]
            let address = decoded_log[i][0];
            let topics = decoded_log[i][1];
            let data = decoded_log[i][2];
            let blockNumber = bigNumberify(decoded_log[i][3]).toNumber();
            let txHash = decoded_log[i][4];
            let txIndex = bigNumberify(decoded_log[i][5]).toNumber();
            let blockHash = decoded_log[i][6];
            let index = bigNumberify(decoded_log[i][7]).toNumber();
            

            let log = {address, topics, data, blockNumber, txHash, txIndex, blockHash, index};
            logs.push(log);

        }
    }
    
    return logs;
}


function decodeReceipt(value: string)
{
    let decoded_re = RLP.decode(value);
    let receipts = parseReceipt(decoded_re);
    
    return receipts;
}


module.exports={ decodeKey, decodeTx, decodeReceipt };
