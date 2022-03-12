import aes256 from 'aes256';

// obviously modified
const salt = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

export const encrypt = (data, hwid, token) => {
    try {
        if (typeof data == 'object')
            data = JSON.stringify(data);

        let key = salt;
        if (hwid) key += hwid;
        if (token) key += token;

        return {
            error: false,
            data: aes256.encrypt(key, data)
        }
    } catch {
        return {
            error: true
        }
    }
}
export const decrypt = (data, hwid = null, token = null) => {
    try {
        if (typeof data == 'object')
            data = JSON.stringify(data);

        let key = salt;
        if (hwid) key += hwid;
        if (token) key += token;

        return {
            error: true,
            data: aes256.decrypt(key, data)
        }
    } catch {
        return {
            error: true
        }
    }
}
