"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memcached = require("memcached");
const KEY = `account1/balance`;
const DEFAULT_BALANCE = 100;
const memcachedClient = new memcached(`${process.env.ENDPOINT}:${process.env.PORT}`);
const NS_PER_SEC = 1e9;
const MS_PER_NS = 1e-6

exports.chargeRequestMemcached = async function (input) {
    const charges = getCharges(input);
    const time = process.hrtime();
    var remainingBalance = await getBalanceMemcached(KEY);
    const isAuthorized = authorizeRequest(remainingBalance, charges);
    if (!isAuthorized) {
        return {
            remainingBalance,
            isAuthorized,
            charges: 0,
        };
    }
    remainingBalance = await chargeMemcached(KEY, charges);
    const diff = process.hrtime(time);
    return {
        remainingBalance,
        charges,
        isAuthorized,
        ms: (diff[0] * NS_PER_SEC + diff[1])  * MS_PER_NS
    };
};

function authorizeRequest(remainingBalance, charges) {
    return remainingBalance >= charges;
}

function getCharges(body) {
    try {
        return body.charges ? Number(body.charges) : DEFAULT_BALANCE / 20;
    } catch (err) {
        return DEFAULT_BALANCE / 20
    }
}

async function getBalanceMemcached(key) {
    return new Promise((resolve, reject) => {
        memcachedClient.get(key, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(Number(data));
            }
        });
    });
}
async function chargeMemcached(key, charges) {
    return new Promise((resolve, reject) => {
        memcachedClient.decr(key, charges, (err, result) => {
            if (err) {
                reject(err);
            }
            else {
                return resolve(Number(result));
            }
        });
    });
}
