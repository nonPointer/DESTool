/**
 * CBC - Cipher Block Chaining
 * key: 56 bits + 8 bits parity = (7 + 1) * 8
 * block size = 64 bits
 * iterations = 16
 * iteration key = 48 bits
 * 1 char = 1 byte = 8 bits, so 8 char = 8 bytes = 64 bits = 1 block
 */

//  enable strict mode
"use strict";

var input = 'Hello world!';
var key = '';

/**
 * Covert ASCII string to binary string with 1 and 0
 * @param str
 * @returns {string}
 */
function strToBin(str) {
    // force conversion to string
    str = String(str);

    let result = [];
    str.split('').forEach(element => {
        let bin = element.charCodeAt(0).toString(2);
        let leading = '';
        while (leading.length + bin.length !== 8)
            leading = leading.concat('0');
        result.push(leading.concat(bin));
    });
    return result.join('');
}

/**
 * Permuted Choice 1
 * @param key
 * @returns {[][]}
 */
function permutedChoice1(key) {
    let pc1_l = [
        57, 49, 41, 33, 25, 17, 9,
        1, 58, 50, 42, 34, 26, 18,
        10, 2, 59, 51, 43, 35, 27,
        19, 11, 3, 60, 52, 44, 36
    ];
    let pc1_r = [
        63, 55, 47, 39, 31, 23, 15,
        7, 62, 54, 46, 38, 30, 22,
        14, 6, 61, 53, 45, 37, 29,
        21, 13, 5, 28, 20, 12, 4
    ];
    let l = [], r = [];
    for (let i in pc1_l) {
        l.push(key[pc1_l[i] - 1]);
    }
    for (let i in pc1_r) {
        r.push(key[pc1_r[i] - 1]);
    }

    return [l, r];
}

/**
 * IP
 * @param lst0
 * @returns {*}
 */
function initialPermutation(lst0) {
    let lst1 = lst0;
    let positions = [
        58, 50, 42, 34, 26, 18, 10, 2,
        60, 52, 44, 36, 28, 20, 12, 4,
        62, 54, 46, 38, 30, 22, 14, 6,
        64, 56, 48, 40, 32, 24, 16, 8,
        57, 49, 41, 33, 25, 17, 9, 1,
        59, 51, 43, 35, 27, 19, 11, 3,
        61, 53, 45, 37, 29, 21, 13, 5,
        63, 55, 47, 39, 31, 23, 15, 7
    ]
    for (let i = 0; i < positions.length; ++i) {
        lst1[i] = lst0[positions[i]];
    }
    return lst1;
}

/**
 * IP^{-1}
 * @param lst0
 * @returns {*}
 */
function finalPermutation(lst0) {
    let lst1 = lst0;
    let positions = [
        40, 8, 48, 16, 56, 24, 64, 32,
        39, 7, 47, 15, 55, 23, 63, 31,
        38, 6, 46, 14, 54, 22, 62, 30,
        37, 5, 45, 13, 53, 21, 61, 29,
        36, 4, 44, 12, 52, 20, 60, 28,
        35, 3, 43, 11, 51, 19, 59, 27,
        34, 2, 42, 10, 50, 18, 58, 26,
        33, 1, 41, 9, 49, 17, 57, 25
    ]
    for (let i = 0; i < positions.length; ++i) {
        lst1[i] = lst0[positions[i]];
    }
    return lst1;
}

// utf8 to base64
let strBase64 = Buffer.from(inputPlainText).toString('base64');

// base64 to utf8
inputPlainText = Buffer.from(strBase64, 'base64').toString('utf8');
console.log(inputPlainText)

input = 'TEST'
console.log(str2bin(input));