import dotenv from 'dotenv';
import path from 'path';
import {  } from './src/Seeders';
dotenv.config({ path: path.join(__dirname, '.env')});
import * as User from './src/Users';
import * as Payment from './src/Payments';
import * as Stream from './src/Streams';

(async() => {
    await User.create({
        "name":"First 1",
        "wallet":"0x1cc5F2F37a4787f02e18704D252735FB714f35EC",
        "signature":"35367e8e7ccbb27acfec785ca4af6e12ae35d768"
    });

    await User.update(1, {
        "name": "First revised",
        "twitch": "twitch.tv/first",
        "facebook": "fb.com/first",
        "discord":"dicord.com/first125123",
        "to_chain":"97",
        "to_token_symbol":"wbnb",
        "to_token_address":"0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
    });

    await User.create({
        "name":"Second 2",
        "wallet":"0x801Df8bD5C0C24D9B942a20627CAF1Bd34427804",
        "signature":"4231ee4f702782973bb7a7e836a238f472c8c197"
    });

    await Payment.create({
        "from_user": 1,
        "from_wallet": "0x1cc5F2F37a4787f02e18704D252735FB714f35EC",
        "from_chain": 97,
        "from_token_symbol": "wbnb",
        "from_token_address": "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
        "from_amount": "1000000000000000",
        "to_user": 2,
        "to_wallet": "0x801Df8bD5C0C24D9B942a20627CAF1Bd34427804",
        "to_chain": 43113,
        "to_token_symbol": "aUSDC",
        "to_token_address": "0x57f1c63497aee0be305b8852b354cec793da43bb",
        "to_amount": "1729",
        "tx_hash": "0x2ebf065cf375d3c729524d733d33ba8535150ac38e97701b9742b7b1f8c72256",
        "usd_worth": "0.2985"
    });

    await Stream.create({
        "user_id": 1,
        "title": "First Live",
        "description": "Starting tonight",
        "thumbnail": "",
        "start_at": null,
        "end_at": null,
        "status": "scheduled"
    });

    console.log('Seed ended, press CTRL / CMD + C');
    return;
})();