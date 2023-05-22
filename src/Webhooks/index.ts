import DB from "../DB"
import {
    formatDBParamsToStr, getAssetUrl,
} from '../../utils';
import _ from "lodash";
import * as UserController from '../Users/index';
import * as StylesController from '../OverlayStyles/index';
import { Webhook, WebhookExecuteParams } from "./types";
import axios from 'axios';

const table = 'stream_webhooks';

// init entry for user
export const init = async(user_id: number) => {
    await create({
        user_id: user_id,
        status: 'inactive',
        type: 'discord',
        value: '',
        template: '',
    });

    return await create({
        user_id: user_id,
        status: 'inactive',
        type: 'custom',
        value: '',
        template: '',
    });
}

// create
export const create = async(insertParams: any): Promise<{[id: string]: number}> => {
    const db = new DB();

    // get user details
    const user = await UserController.view(insertParams.user_id);

    // get qr insert field
    const fillableColumns = [ 'user_id', 'status', 'value', 'template', 'type' ];
    const filtered = _.pick(insertParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ', true);
    const insertColumns = Object.keys(filtered);

    // insert into qr table
    const query = `INSERT INTO ${table} (${_.join(insertColumns, ', ')}) VALUES (${params}) RETURNING id`;
    const result = await db.executeQueryForSingleResult(query);

    return result;
}

// view (single - id)
export const view = async(id: number): Promise<Webhook> => {
    const query = `SELECT * FROM ${table} WHERE id = ${id} LIMIT 1`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);

    if (result) {
        result.qr = getAssetUrl(result.qr);
        const style = await StylesController.view(result.style_id);

        _.merge(result, style);
    }

    return result ?? {};
}

// find (all match)
export const find = async(whereParams: {[key: string]: any}): Promise<Webhook[]> => {
    const params = formatDBParamsToStr(whereParams, ' AND ');
    const query = `SELECT * FROM ${table} WHERE ${params}`;

    const db = new DB();
    const result: Webhook[] | undefined = await db.executeQueryForResults(query);
    return result as Webhook[] ?? [];
}

// list (all)
export const list = async(): Promise<Webhook[]> => {
    const query = `SELECT * FROM ${table}`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    _.map(result, (r, k) => {
        result![k].qr = getAssetUrl(result![k].qr);
    })

    return result as Webhook[] ?? [];
}

// update
export const update = async(id: number, updateParams: {[key: string]: any}): Promise<void> => {
    const qr = await view(id);

    const users = await UserController.find({ id: qr.user_id, signature: updateParams.signature });
    if(users.length === 0) {
        throw Error("Unauthorized!");
    }

    // filter
    const fillableColumns = [ 'status', 'value', 'template', 'type' ];
    const filtered = _.pick(updateParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ');

    const query = `UPDATE ${table} SET ${params} WHERE id = ${id}`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);
}

// tests the webhook notification
export const test = async(id: number): Promise<void> => {
    let donator = 'Chad';
    let amount = 99;
    await execute(id, {
        donator,
        amount
    });
}

export const execute = async(id: number, params: WebhookExecuteParams) => {
    const webhook = await view(id);
    if(!webhook) {
        throw Error("Missing webhook");
    }

    if(!webhook.value) {
        throw Error("Missing webhook");
    }

    let {
        donator,
        amount
    } = params;

    let message = webhook.template.replace(/{{donator}}/g, donator).replace(/{{amount}}/g, amount.toString());
    await axios.post(webhook.value, { content: message });
} 

// delete (soft delete?)
// export const delete = async(userId: number) => {
//     const query = `DELETE FROM ${table} WHERE user_id = ${userId}`;

//     const db = new DB();
//     await db.executeQueryForSingleResult(query);

//     return result;
// }
