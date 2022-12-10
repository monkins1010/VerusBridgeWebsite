import {
    extractPublicKey
} from 'eth-sig-util';

import {
    ecrecover,
    BN,
} from 'ethereumjs-util'

export const signTypedDataV4 = async (account, chain_Id, util) => {
    const networkId = parseInt(1);
    const chainId = parseInt(chain_Id) || networkId;

    const exampleMessage = 'This signature allows Verus to know your Wallet public address, so any transaction can be refunded to it';
    try {
        const from = account;
        const msg = `0x${Buffer.from(exampleMessage, 'utf8').toString('hex')}`;
        const sign = await ethereum.request({
            method: 'personal_sign',
            params: [msg, from, 'Example password'],
        });
        console.log(sign);

        const msgParams = {
            data: exampleMessage,
            sig: sign
        };
        const jim = extractPublicKey(msgParams);

        console.log(publicKey);
        return jim;
    } catch (err) {
        console.error(err);
    }

};