function custom() {
    let plain = document.querySelector('#plainTextarea');
    let cipher = document.querySelector('#cipherTextarea');
    let cipherText = document.querySelector('#cipherTextTextarea');
    let separater = document.querySelector('#separator');
    let separaterValue = '';

    // false: plain, true: ciphertext
    // used for detect process direction when cipher has been changed
    let state = false;

    plain.oninput = function () {
        state = false;
        console.log('plain', plain.value);
        cipherText.value = binToHex(strToBin(ECB(binToHex(strToBin(plain.value)), cipher.value, false, '')), separaterValue);
        cipherText.setCustomValidity('');
        cipherText.reportValidity();
    };

    cipher.oninput = function () {
        console.log('cipher', cipher.value);

        if (state) {
            plain.value = ECB(cipherText.value, cipher.value, true, '');
            console.log(calculateVisibleASCII(plain.value));
        } else {
            cipherText.value = binToHex(strToBin(ECB(binToHex(strToBin(plain.value)), cipher.value, false, '')), separaterValue);
        }

        // check cipher length
        if (cipher.value.length === 8) {
            cipher.setCustomValidity('');
        } else {
            cipher.setCustomValidity('Non-standard cipher length');
        }
        cipher.reportValidity();
    };

    cipherText.oninput = function () {
        state = true;
        console.log('cipherText', cipherText.value);

        // check if valid block length
        if (checkCipherText()) {
            plain.value = ECB(cipherText.value, cipher.value, true, '');
        }
    };

    function checkCipherText() {
        if (cipherText.value.length % 16 !== 0) {
            cipherText.setCustomValidity('Decryption failed');
            cipherText.reportValidity();
            return false;
        } else {
            console.log('length valid');
            cipherText.setCustomValidity('');
            cipherText.reportValidity();
            return true;
        }
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

            // clean displayed filename
            cipherFile.value = '';

            mdui.snackbar({
                message: 'Task finished!'
            });
        } else {
            // encrypt
            let json = {'filename': filename, 'data': fileContent};
            let blob = new Blob([ECB(JSON.stringify(json), cipherText.value, fileMethod, filename)]);
            let cipherDownload = document.querySelector('#cipherDownload');
            cipherDownload.href = URL.createObjectURL(blob);
            cipherDownload.download = filename.concat('.encrypted');
            cipherDownload.click();

            // clean displayed filename
            plainFile.value = '';

            mdui.snackbar({
                message: 'Task finished!'
            });
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

    separater.oninput = function () {
        separaterValue = separater.value.toString();
        if (!state) {
            plain.oninput();
        }
    };
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
    let byteString = atob(dataURI.split(',')[1]);
    let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    let ab = new ArrayBuffer(byteString.length);
    let ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], {type: mimeString});
}

function copyCiphertext() {
    document.querySelector('#cipherTextTextarea').select();
    document.execCommand("copy");
    mdui.snackbar({
        message: 'Copied'
    });
}

function copyPlaintext() {
    document.querySelector('#plainTextarea').select();
    document.execCommand("copy");
    mdui.snackbar({
        message: 'Copied'
    });
}