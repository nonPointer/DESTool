/**
 * key: 56 bits + 8 bits parity = (7 + 1) * 8
 * block size = 64 bits
 * iterations = 16
 * iteration key = 48 bits
 * 1 char = 1 byte = 8 bits, so 8 char = 8 bytes = 64 bits = 1 block
 */

//  enable strict mode
"use strict";

// debug mode
var DEBUG = false;

/**
 * Covert ASCII string to binary string with 1 and 0
 * @param str {string} ASCII string
 * @returns {string} Binary string
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

    let len;
    if (bin.length % 8 === 0)
        len = Math.round(bin.length / 8);
    else if (bin.length === 6)
        bin = '00'.concat(bin);

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
 * Convert bin to int
 * @param bin {string}
 * @return {number}
 */
function binToInt(bin) {
    bin = bin.split('');
    let res = 0;
    while (bin.length !== 0) {
        res = res * 2 + Number(bin.shift());
    }
    return res;
}

/**
 * Convert int to bin
 * @param n {number}
 * @return {string}
 */
function intToBin(n) {
    let res = Number(n).toString(2);
    while (res.length !== 4) {
        res = '0'.concat(res);
    }
    return res;
}

/**
 * Regulate key into 64-bit fixed size
 * @param keyPlain {string} cleartext key
 * @returns {string} 8 char ASCII string
 */
function keyPreprocessing(keyPlain) {

    if (keyPlain.length < 8) {
        // for short key, append zero byte
        while (keyPlain.length !== 8)
            keyPlain = keyPlain.concat('\0');

        return keyPlain;
    } else if (keyPlain.length > 8) {
        // for longer bit, use zero byte padding then XOR each bit
        while (keyPlain.length % 8 !== 0) {
            keyPlain = keyPlain.concat('\0');
        }
        let round = Math.round(keyPlain.length / 8);
        let res = [];
        for (let i = 0; i < 8; ++i) {
            res.push(keyPlain[i].charCodeAt(0));
        }
        for (let i = 1; i < round; ++i) {
            for (let j = 0; j < 8; ++j)
                res[j] = res[j] ^ keyPlain[i * 8 + j].charCodeAt(0);
        }
        keyPlain = '';
        while (res.length > 0) {
            keyPlain = keyPlain.concat(String.fromCharCode(res.shift()));
        }

        return keyPlain;
    }
    return keyPlain;
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
 * @param keyBin {string} binary string 64bits
 * @returns {number[][]}
 */
function keyGenerator(keyBin) {
    // if (DEBUG) {
    //     console.assert(keyBin.length == 64);
    // }
    let keyL = permutedChoice1(keyBin)[0];
    let keyR = permutedChoice1(keyBin)[1];

    let offsets = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];
    let subKeys = [];

    for (let i = 0; i < 16; ++i) {
        keyL = leftRotation(keyL, offsets[i]);
        keyR = leftRotation(keyR, offsets[i]);

        if (DEBUG) {
            // console.log('l ' + keyL);
            // console.log('r ' + keyR);
        }
        subKeys.push(permutedChoice2(keyL.concat(keyR)));
    }
    return subKeys;
}

/**
 * Permuted Choice 1
 * @param keyBin {string} 64 bits in string
 * @returns {number[][]} left and right block bits in 2-dimensional array
 */
function permutedChoice1(keyBin) {
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
        l.push(keyBin[pc1_l[i] - 1]);
    }
    for (let i in pc1_r) {
        r.push(keyBin[pc1_r[i] - 1]);
    }
    if (DEBUG) {
        // console.log('keyBin ' + keyBin)
        // console.log('l ' + l);
        // console.log('r ' + r);
    }

    return [l, r];
}

/**
 * Permuted Choice 2
 * @param keyBin {string} 56 bits in string
 * @returns {number[]} 48 bits in array
 */
function permutedChoice2(keyBin) {
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
        res.push(keyBin[pc2[i] - 1]);
    }
    return res;
}

/**
 * IP
 * @param bin {string} 64 bits in block
 * @returns {string} 64 bits in block
 */
function initialPermutation(bin) {
    let res = [];
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
        res.push(bin[positions[i] - 1]);
    }
    // if (DEBUG) {
    //     console.assert(res.length === 64, 'bad IP block size');
    // }
    return res.join('');
}

/**
 * IP^{-1}
 * @param bin {string} 64 bits in string
 * @returns {string} 64 bits in string
 */
function finalPermutation(bin) {
    let res = [];
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
        res.push(bin[positions[i] - 1]);
    }

    return res.join('');
}

/**
 * a XOR b
 * @param strA {string}
 * @param strB {string}
 * @return {string}
 */
function binXor(strA, strB) {
    let res = '';
    let len = strA.length;
    for (let i = 0; i < len; ++i) {
        res = res.concat(strA.charCodeAt(i) ^ strB.charCodeAt(i));
    }
    return res;
}

/**
 * Convert bin string to hex string
 * @param str {string} bits in string
 * @param separator {string} separator between each byte
 * @returns {string} hex string
 */
function binToHex(str, separator = '') {
    let res = [];
    let hexMap = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];

    // console.assert(str.length % 8 === 0, 'bad binToHex block');

    for (let i = 0; i < str.length / 8; ++i) {
        let c = 0;
        for (let j = 0; j < 8; ++j) {
            c = c * 2 + Number(str[i * 8 + j]);
        }
        res.push(hexMap[Math.floor(c / 16)].concat(hexMap[Math.round(c) % 16]));
    }
    return res.join(separator)
}

/**
 * Convert hex string to bin string
 * @param str {string} hex string
 * @param separator {string} the separator between each byte
 * @return {string} bin string
 */
function hexToBin(str, separator = '') {
    let res = [];
    str = str.toLowerCase()

    // console.assert(str.length % 2 === 0, 'bad hexToBin block');

    let binMap = {
        '0': 0, '1': 1, '2': 2, '3': 3,
        '4': 4, '5': 5, '6': 6, '7': 7,
        '8': 8, '9': 9, 'a': 10, 'b': 11,
        'c': 12, 'd': 13, 'e': 14, 'f': 15
    }
    for (let i = 0; i < str.length / 2; ++i) {
        let c = binMap[str[i * 2]] * 16 + binMap[str[i * 2 + 1]];
        let bin = c.toString(2);
        while (bin.length !== 8)
            bin = '0'.concat(bin);
        res.push(bin);
    }
    return res.join(separator);
}

/**
 * Feistel process
 * @param arr {string} 32 bits in bin string
 * @param subKey {number[]} 48 bits in array
 * @return {number[]} 32 bits in array
 */
function Feistel(arr, subKey) {
    // if (DEBUG) {
    //     console.assert(arr.length === 32, 'bad Feistel block size');
    //     console.assert(subKey.length === 48, 'bad Feistel subKey size');
    // }

    let t = binXor(expansion(arr).join(''), subKey.join(''));
    t = S(t);
    t = P(t);
    return t;
}

/**
 * expand the half-block
 * @param arr {string[]} 32 bits in bin string
 * @returns {number[]} 48 bits in bin string
 */
function expansion(arr) {
    // if (DEBUG) {
    //     console.assert(arr.length === 32, 'bad expansion array size');
    // }

    let eTable = [
        32, 1, 2, 3, 4, 5,
        4, 5, 6, 7, 8, 9,
        8, 9, 10, 11, 12, 13,
        12, 13, 14, 15, 16, 17,
        16, 17, 18, 19, 20, 21,
        20, 21, 22, 23, 24, 25,
        24, 25, 26, 27, 28, 29,
        28, 29, 30, 31, 32, 1
    ];
    let ans = [];
    for (let i in eTable) {
        ans.push(arr[eTable[i] - 1]);
    }
    return ans;
}

/**
 * S Box permutation
 * @param arr {string} 48 bits in bin string
 * @return {string} 32 bits in bin string
 */
function S(arr) {
    let sBox = [
        [14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7,
            0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8,
            4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0,
            15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13],
        [15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10,
            3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5,
            0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15,
            13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9],
        [10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8,
            13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1,
            13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7,
            1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12],
        [7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15,
            13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9,
            10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4,
            3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14],
        [2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9,
            14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6,
            4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14,
            11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3],
        [12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11,
            10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8,
            9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6,
            4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13],
        [4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1,
            13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6,
            1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2,
            6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12],
        [13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7,
            1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2,
            7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8,
            2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11]
    ];

    let arr2 = [];
    for (let i = 0; i < 8; ++i) {
        arr2.push(arr.slice(i * 6, i * 6 + 6));
    }

    let res = [];
    for (let i = 0; i < 8; ++i) {
        let p = arr2[i];
        let r = sBox[i][binToInt([p[0], p[5], p[1], p[2], p[3], p[4]].join(''))];
        res.push(intToBin(r));
    }

    // if (DEBUG) {
    //     console.log('res[0]', res[0]);
    // }
    res = res.join('');

    // console.assert(res.length === 32, 'bad S');
    return res;
}

/**
 * P permutation
 * @param arr {string} 32 bits in bin string
 * @return {string} 32 bits in bin string
 */
function P(arr) {
    let p = [
        16, 7, 20, 21,
        29, 12, 28, 17,
        1, 15, 23, 26,
        5, 18, 31, 10,
        2, 8, 24, 14,
        32, 27, 3, 9,
        19, 13, 30, 6,
        22, 11, 4, 25
    ];
    let res = [];
    for (let i in p) {
        res.push(arr[p[i] - 1]);
    }

    // if (DEBUG) {
    //     console.assert(res.length === 32, 'bad p');
    // }

    return res.join('');
}

/**
 * the 16 iterations of block encryption
 * @param l {string} 32 bits in bin string
 * @param r {string} 32 bits in bin string
 * @param subKey {number[]}
 * @return {[number[], number[]]}
 */
function encipher(l, r, subKey) {
    return [r, binXor(l, Feistel(r, subKey))];
}

/**
 * DES Core
 * @param textBin {string} 64 bit bin block
 * @param keyBlock {string} the regulated key
 * @param decrypt {boolean}
 * @return {string} ciphertext | plaintext
 */
function DES(textBin, keyBlock, decrypt) {
    // generate sub-keys from master key
    let subKeys = keyGenerator(strToBin(keyBlock));
    if (decrypt)
        subKeys = subKeys.reverse();

    // split into semi-block
    // l: bin str, r: bin str
    let l = initialPermutation(textBin).slice(0, 32);
    let r = initialPermutation(textBin).slice(32, 64);

    // 16 rounds of enciphering
    for (let i = 0; i < 16; ++i) {
        let t = encipher(l, r, subKeys[i]);
        l = t[0];
        r = t[1];
    }

    return binToStr(finalPermutation(r.concat(l)));
}

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

/**
 * Padding pkcs5
 * @param str {string} ASCII string
 * @return {string} ASCII string
 */
function pkcs5Padding(str) {
    let p = 8 - str.length % 8;
    for (let i = 0; i < p; ++i) {
        str = str.concat(String.fromCharCode(p));
    }
    return str;
}

/**
 * De-padding pkcs5
 * @param str {string} ASCII string
 * @return {string} ASCII string
 */
function pkcs5DePadding(str) {
    let p = str.charCodeAt(str.length - 1);
    return str.slice(0, str.length - p);
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
        console.assert(binXor('11110000', '00001111') === '11111111');
        console.assert(binXor('11111111', '00001111') === '11110000');
        console.assert(binXor('1010101010', '0101010101') === '1111111111');
    }
    // keygen
    {
        // console.log(keyGenerator(strToBin(keyPreprocessing('1234'))));
    }
    // DES
    {
        console.log('#1')
        console.log('ciphertext\t' + strToBin(DES(strToBin('12345678'), keyPreprocessing('1111'), false)));
        console.log('ciphertext\t' + (DES(strToBin('12345678'), keyPreprocessing('1111'), false)));
        console.log('#2')
        console.log('ciphertext\t' + strToBin(DES(strToBin('12345678'), keyPreprocessing('11111111'), false)));
        console.log('ciphertext\t' + (DES(strToBin('12345678'), keyPreprocessing('11111111'), false)));
        console.log('#3')
        console.log('ciphertext\t' + strToBin(DES(strToBin('12345678'), keyPreprocessing('12345678'), false)));
        console.log('#4 good')
        console.log('plaintext\t' + DES('0011000110011100100011111100100101110111111000000011000111000110', keyPreprocessing('1111'), true));
        console.log('#5 good')
        console.log('plaintext\t' + DES('0011101100101100011111000111111001101000001010011010111011011010', keyPreprocessing('88888888'), true));
        console.log('#6 bad')
        console.log('plaintext\t' + DES('0011101100101100011111000111111001101000001010011010111011011010', keyPreprocessing('8888888888888888'), true));
    }
    // binToHex HexToBin
    {
        console.assert(binToHex('10000101100001011000010110000101', '') === '85858585', 'bad binToHex');
        console.assert(hexToBin('85858585', '') === '10000101100001011000010110000101', 'bad hexToBin');
    }
    // pkcs5
    {
        let strA = '1234567812345';
        console.assert(strA === pkcs5DePadding(pkcs5Padding(strA)), 'bad pkcs5');
        let strB = '';
        console.assert(strB === pkcs5DePadding(pkcs5Padding(strB)), 'bad pkcs5');
        let strC = '12345678 ';
        console.assert(strC === pkcs5DePadding(pkcs5Padding(strC)), 'bad pkcs5');
    }
    // ECB
    {
        console.log('ECB');
        // text
        let t1 = binToHex(strToBin(ECB(binToHex(strToBin('1234567887654321')), '11111111', false, false)));
        console.log('t1', t1);
        let t2 = ECB('858B176DA8B125036B7E5F725DFB0A34AD6A88B4FA37833D', '11111111', true, false);
        console.log('t2', t2);
        // simulate file
        // decrypt
        let file1 = {
            'filename': '3.txt',
            'data': '858B176DA8B125036B7E5F725DFB0A34AD6A88B4FA37833D'
        };
        let t3 = ECB(JSON.stringify(file1), '11111111', true, 'file');
        console.log('t3', JSON.stringify(t3));
        // encrypt
        let file2 = {
            'filename': '4.txt',
            'data': '1234567887654321'
        }
        let t4 = ECB(JSON.stringify(file2), '11111111', false, '2.txt');
        console.log('t4', JSON.stringify(t4));
    }

}

/**
 * split bin to 64-bit block
 * @param str
 * @return {string[]}
 */
function splitToBlock(str) {
    console.assert(str.length % 64 === 0, 'bad splitToBlock block');
    let blocks = [];
    for (let i = 0; i < str.length / 64; ++i) {
        blocks.push(str.slice(i * 64, (i + 1) * 64));
    }
    return blocks;
}

/**
 * ECB Mode
 * @param data {string|json} hex string or file stream as json
 * @param keyText {string}
 * @param decrypt {boolean} decrypt?
 * @param filename {string} filename if exist
 * @return {string}
 * @constructor
 */
function ECB(data, keyText, decrypt, filename) {

    let keyBlock = keyPreprocessing(keyText);

    let dataOrigin;

    // process json
    if (filename.length > 0) {
        let json = JSON.parse(data);
        // override var with the origin filename
        filename = json['filename'];
        if (!decrypt) {
            // encrypt
            dataOrigin = json['data'];
        } else {
            // already hex
            dataOrigin = binToStr(hexToBin(json['data']));
        }
    } else {
        dataOrigin = binToStr(hexToBin(data));
    }

    // split bin into 64-bit blocks
    let binBlocks;
    if (!decrypt) {
        // pkcs5 padding
        binBlocks = splitToBlock(strToBin(pkcs5Padding(dataOrigin)));
    } else {
        binBlocks = splitToBlock(strToBin(dataOrigin));
    }

    // console.log(binBlocks.join(''));

    // call DES Core
    for (let i = 0; i < binBlocks.length; ++i) {
        binBlocks[i] = DES(binBlocks[i], keyBlock, decrypt);
    }

    let result;
    if (decrypt) {
        // pkcs5 depadding
        result = pkcs5DePadding(binBlocks.join(''));
    } else {
        result = binBlocks.join('');
    }

    // recover the file
    if (filename.length > 0) {
        if (decrypt) {
            result = {'filename': filename, 'data': result};
        } else {
            result = {'filename': filename, 'data': binToHex(strToBin(result))};
        }
        result = JSON.stringify(result);
    }

    return result;
}

if (DEBUG) {
    testCase();
}