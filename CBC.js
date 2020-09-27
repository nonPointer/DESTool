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

function str2bin(str) {
    let result = [];
    str.split('').forEach(element => {
        let bin = element.charCodeAt(0).toString(2);
        let leading = '' + (8 - bin.length) * '0';
        result.push(leading + bin);
    });
    return result.join('');
}

// utf8 to base64
var strBase64 = Buffer.from(input).toString('base64');
console.log(strBase64);

// base64 to utf8
input = Buffer.from(strBase64, 'base64').toString('utf8');
console.log(input)

input = 'TEST'
console.log(str2bin(input));