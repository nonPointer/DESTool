function custom() {
    let plain = document.querySelector('#plainTextarea');
    let cipher = document.querySelector('#cipherTextarea');
    let cipherText = document.querySelector('#cipherTextTextarea');

    // false: plain, true: ciphertext
    // used for detect process direction when cipher has been changed
    let state = false;

    plain.oninput = function () {
        state = false;
        console.log('plain', plain.value);
        cipherText.value = binToHex(strToBin(ECB(binToHex(strToBin(plain.value)), cipher.value, false, '')));
        cipherText.setCustomValidity('');
    };
    // plain.onchange = plain.oninput;

    cipher.oninput = function () {
        console.log('cipher', cipher.value);
        checkPlainValid()

        if (state) {
            plain.value = ECB(cipherText.value, cipher.value, true, '');
            console.log(calculateVisibleASCII(plain.value));
        } else {
            cipherText.value = binToHex(strToBin(ECB(binToHex(strToBin(plain.value)), cipher.value, false, '')));
        }

        if (cipher.value.length === 8) {
            cipher.setCustomValidity('');
        } else {
            cipher.setCustomValidity('Non-standard cipher length');
        }
    };
    // cipher.onchange = cipher.oninput;

    cipherText.oninput = function () {
        state = true;
        console.log('cipherText', cipherText.value);

        // check if valid block length
        if (cipherText.value.length % 16 === 0) {
            plain.value = ECB(cipherText.value, cipher.value, true, '');
            checkPlainValid();
        } else {
            setTimeout(function () {
                    if (cipherText.value.length % 16 !== 0) {
                        cipherText.setCustomValidity('Invalid ciphertext length');
                    } else {
                        cipherText.setCustomValidity('');
                    }
                }, 1000
            );
        }

    };
    // mark invalid ciphertext after changed
    cipherText.onchange = function () {
        if (cipherText.value.length % 16 === 0) {
            cipherText.setCustomValidity('');
        } else {
            cipherText.setCustomValidity('Invalid ciphertext');
        }
    }

    function checkPlainValid() {

        setTimeout(function () {
                if (calculateVisibleASCII(plain.value) === 0) {
                    cipherText.setCustomValidity('Decryption failed');
                    cipher.setCustomValidity('Decryption failed');
                } else {
                    cipherText.setCustomValidity('');
                    cipher.setCustomValidity('');
                }
            }, 1000
        );
    }

    // file process
    // false: encrypt, true: decrypt
    let fileMethod = false;
    let filename = '';

    let fileReader = new FileReader();
    fileReader.onload = function (event) {
        console.log('method', fileMethod ? 'decrypt' : 'encrypt');

        let fileContent = event.target.result;
        console.log('fileLength', fileContent.length);

        if (fileMethod) {
            // decrypt
            let json = JSON.parse(fileContent);
            let blobPayload = JSON.parse(ECB(JSON.stringify(json), cipherText.value, fileMethod, filename))['data'];
            // let blob = new Blob([blobPayload]);
            let blob = dataURItoBlob(blobPayload);
            let plainDownload = document.querySelector('#plainDownload');
            plainDownload.href = URL.createObjectURL(blob);
            // plainDownload.href = blob.text();
            // override filename with the origin
            plainDownload.download = json['filename'];
            plainDownload.click();
        } else {
            // encrypt
            let json = {'filename': filename, 'data': fileContent};
            let blob = new Blob([ECB(JSON.stringify(json), cipherText.value, fileMethod, filename)]);
            let cipherDownload = document.querySelector('#cipherDownload');
            cipherDownload.href = URL.createObjectURL(blob);
            cipherDownload.download = filename.concat('.encrypted');
            cipherDownload.click();
        }
    };

    let plainFile = document.querySelector('#plainFile');
    plainFile.onchange = function (event) {
        fileMethod = false;
        let file = event.target.files[0];
        filename = file.name;
        fileReader.readAsDataURL(file);
    }

    let cipherFile = document.querySelector('#cipherFile');
    cipherFile.onchange = function (event) {
        fileMethod = true;
        let file = event.target.files[0];
        filename = file.name;
        // fileReader.readAsDataURL(file);
        fileReader.readAsBinaryString(file);
    }
}

/**
 * Calculate visible ASCII in the decryption data
 * @param str
 * @return {number}
 */
function calculateVisibleASCII(str) {
    let res = 0;
    for (let i = 0; i < str.length; ++i) {
        if (/\w|\s/.test(str[i]))
            res++;
    }
    return res;
}

/**
 * Utility function for convert dataURI into Blob object
 * @Matt
 * https://stackoverflow.com/questions/6850276/how-to-convert-dataurl-to-file-object-in-javascript
 * @param dataURI
 * @return {Blob}
 */
function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    //Old Code
    //write the ArrayBuffer to a blob, and you're done
    //var bb = new BlobBuilder();
    //bb.append(ab);
    //return bb.getBlob(mimeString);

    //New Code
    return new Blob([ab], {type: mimeString});


}