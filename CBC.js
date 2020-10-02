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

/**
 * Covert ASCII string to binary string with 1 and 0
 * @param str {string}
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
 * Convert bin into ASCII string.
 * @param bin {string}
 * @returns {string}
 */
function binToStr(bin) {
    let result = '';

    console.assert(bin.length % 8 === 0, 'invalid bin str');
    let len = Math.round(bin.length / 8);
    for (let i = 0; i < len; ++i) {
        let t = 0;
        for (let j = 0; j < 8; ++j) {
            t = t * 2 + Number(bin[i * 8 + j]);
        }
        result = result.concat(String.fromCharCode(t));
    }

    return result;
}

/**
 * Regulate key into 64-bit fixed size
 * @param key {string}
 * @returns {string}
 */
function keyPreprocessing(key) {

    if (key.length < 8) {
        // for short key, append zero byte
        while (key.length !== 8)
            key = key.concat('\0');

        return key;
    } else if (key.length > 8) {
        // for longer bit, use zero byte padding then XOR each bit
        while (key.length % 8 !== 0) {
            key = key.concat('\0');
        }
        let round = Math.round(key.length / 8);
        let res = [];
        for (let i = 0; i < 8; ++i) {
            res.push(key[i].charCodeAt(0));
        }
        for (let i = 1; i < round; ++i) {
            for (let j = 0; j < 8; ++j)
                res[j] = res[j] ^ key[i * 8 + j].charCodeAt(0);
        }
        key = '';
        while (res.length > 0) {
            key = key.concat(String.fromCharCode(res.shift()));
        }

        return key;
    }

    return key;
}

/**
 * Left rotate the key set
 * @param arr {number[]} array of selected key bits
 * @param offset {number} the offset of rotation
 * @returns {number[]}
 */
function leftRotation(arr, offset) {
    // just in case offset exceed the length of array;
    offset = offset % arr.length;
    return arr.slice(offset).concat(arr.slice(0, offset));
}

/**
 * Derive 16 sub-keys from the master key.
 * @param key {string} binary string
 * @returns {number[]}
 */
function keyGenerator(key) {
    let keyLr = permutedChoice1(key);
    let keyL = keyLr[0];
    let keyR = keyLr[1];

    let offsets = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];
    let subKeys = [];

    for (let i = 0; i < 16; ++i) {
        keyL = leftRotation(keyL, offsets[i]);
        keyR = leftRotation(keyR, offsets[i]);

        subKeys.push(permutedChoice2(keyL.concat(keyR)));
    }

    return subKeys;
}

/**
 * Permuted Choice 1
 * @param key {string}
 * @returns {string[]}
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
 * Permuted Choice 2
 * @param key {string[]}
 * @returns {string[]}
 */
function permutedChoice2(key) {
    let pc2 = [
        14, 17, 11, 24, 1, 5,
        3, 28, 15, 6, 21, 10,
        23, 19, 12, 4, 26, 8,
        16, 7, 27, 20, 13, 2,
        41, 52, 31, 37, 47, 55,
        30, 40, 51, 45, 33, 48,
        44, 49, 39, 56, 34, 53,
        46, 42, 50, 36, 29, 32
    ];

    let res = [];
    for (let i in pc2) {
        res.push(key[pc2[i]]);
    }

    return res;
}

/**
 * IP
 * @param lst0 {string[]}
 * @returns {string[]}
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
 * @param lst0 {string[]}
 * @returns {string[]}
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

/**
 * a XOR b
 * @param a {string}
 * @param b {string}
 * @return {string}
 */
function binXor(a, b) {
    let res = '';
    for (let i in a) {
        res = res.concat(a.charCodeAt(i) ^ b.charCodeAt(i));
    }
    return res;
}

/**
 * custom test case
 */
function testCase() {
    // str2bin
    {
        let testBinA =
            '01001000011001010110110001101100' +
            '01101111001000000111011101101111' +
            '01110010011011000110010000100001';
        console.assert(strToBin('Hello world!') === testBinA, 'str2bin failed');
        let testBinB = '010001000100010101010011';
        console.assert(strToBin('DES') === testBinB, 'str2bin failed');
    }
    // bin2str
    {
        let testBinA =
            '01001000011001010110110001101100' +
            '01101111001000000111011101101111' +
            '01110010011011000110010000100001';
        console.assert('Hello world!' === binToStr(testBinA), 'str2bin failed');
        let testBinB = '010001000100010101010011';
        console.assert('DES' === binToStr(testBinB), 'str2bin failed');
    }
    // leftRotate
    {
        let testArray = [1, 2, 3, 4, 5];
        console.assert(leftRotation(testArray, 1)[0] === 2, 'leftRotate failed');
        console.assert(leftRotation(testArray, 2)[0] === 3, 'leftRotate failed');
        // need module just in case offset > array length
        console.assert(leftRotation(testArray, 6)[0] === 2, 'leftRotate failed');
        console.assert(leftRotation(testArray, 11)[0] === 2, 'leftRotate failed');
    }
    // keyPreprocessing
    {
        let testBinA = '0011000100110001001100010011000100000000000000000000000000000000';
        console.assert(strToBin(keyPreprocessing('1111')) === testBinA, 'strToBin failed');
        let testBinB = '0011000100110001001100010011000100110001001100010011000100110001';
        console.assert(strToBin(keyPreprocessing('11111111')) === testBinB, 'strToBin failed');
        let testBinC = '0000000000000000000000000000000000000000000000000000000000000000';
        console.assert(strToBin(keyPreprocessing('1111111111111111')) === testBinC, 'strToBin failed');
    }
    // binXor
    {
        console.log(binXor('11110000', '00001111'));
        console.assert(binXor('11110000', '00001111') === '11111111');
        console.assert(binXor('11111111', '00001111') === '11110000');
    }
}


}

/**
 * Blob binary or plaintext
 * @type {string}
 */
let inputPlainText = 'Hello world!';

/**
 * Key, default empty
 * @type {string}
 */
let inputKey = '';

/*
Test case #1
    plaintext: Hello world!
    key: 12345678
    supposed ciphertext: U2FsdGVkX19q4LK72ili7H6717XJjO/++vERZ3bBJ+I=

Test case #2
    plaintext: DES
    key: 88888888
    supposed ciphertext: U2FsdGVkX196fVuVKl+RFBau+1jLTRiE
 */

// utf8 to base64
let strBase64 = Buffer.from(inputPlainText).toString('base64');

// base64 to utf8
inputPlainText = Buffer.from(strBase64, 'base64').toString('utf8');
console.log(inputPlainText)

testCase();