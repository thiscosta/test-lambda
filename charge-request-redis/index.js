"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const util = require("util");
const KEY = `account1/balance`;
const DEFAULT_BALANCE = 100;

exports.chargeRequestRedis = async function (input) {
    const redisClient = await getRedisClient();
    let remainingBalance = await getBalanceRedis(redisClient, KEY);
    const charges = getCharges(input);
    const isAuthorized = authorizeRequest(remainingBalance, charges);
    if (!isAuthorized) {
        return {
            remainingBalance,
            isAuthorized,
            charges: 0,
        };
    }
    remainingBalance = await chargeRedis(redisClient, KEY, charges);
    await disconnectRedis(redisClient);
    return {
        remainingBalance,
        charges,
        isAuthorized,
    };
};

async function getRedisClient() {
    return new Promise((resolve, reject) => {
        try {
            const client = new redis.RedisClient({
                host: process.env.ENDPOINT,
                port: parseInt(process.env.PORT || "6379"),
            });
            client.on("ready", () => {
                console.log('redis client ready');
                resolve(client);
            });
        }
        catch (error) {
            reject(error);
        }
    });
}

async function disconnectRedis(client) {
    return new Promise((resolve, reject) => {
        client.quit((error, res) => {
            if (error) {
                reject(error);
            }
            else if (res == "OK") {
                console.log('redis client disconnected');
                resolve(res);
            }
            else {
                reject("unknown error closing redis connection.");
            }
        });
    });
}

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

async function getBalanceRedis(redisClient, key) {
    const res = await util.promisify(redisClient.get).bind(redisClient).call(redisClient, key);
    return parseInt(res || "0");
}

async function chargeRedis(redisClient, key, charges) {
    return util.promisify(redisClient.decrby).bind(redisClient).call(redisClient, key, charges);
}
