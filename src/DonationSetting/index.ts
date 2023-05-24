import DB from "../DB"
import {
    formatDBParamsToStr,
} from '../../utils';
import _ from "lodash";
import { DonationSetting } from "./types";

const table = 'user_donation_setting';

// init entry for user
export const init = async(user_id: number) => {
    return await create({
        user_id: user_id,
        to_chain: 97,
        to_token_symbol: 'bnb',
        to_token_address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        quick_amount: '[3, 10, 25, 50]'
    });
}

// create
export const create = async(insertParams: any): Promise<{[id: string]: number}> => {
    const fillableColumns = [ 'user_id', 'to_chain', 'to_token_symbol', 'to_token_address', 'quick_amount' ];

    const filtered = _.pick(insertParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ', true);

    // put quote
    const insertColumns = Object.keys(filtered);

    const query = `INSERT INTO ${table} (${_.join(insertColumns, ', ')}) VALUES (${params}) RETURNING id`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);

    return result;
}

// view (single - id)
export const view = async(id: number): Promise<DonationSetting> => {
    const query = `SELECT to_chain, to_token_symbol, to_token_address FROM ${table} WHERE id = ${id} LIMIT 1`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);

    return result ?? {};
}

// find (all match)
export const find = async(whereParams: {[key: string]: any}): Promise<DonationSetting[]> => {
    const params = formatDBParamsToStr(whereParams, ' AND ');
    const query = `SELECT * FROM ${table} WHERE ${params}`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    return result as DonationSetting[] ?? [];
}

// list (all)
export const list = async(): Promise<DonationSetting[]> => {
    const query = `SELECT * FROM ${table}`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    return result as DonationSetting[] ?? [];
}

// update
export const update = async(id: number, updateParams: {[key: string]: any}): Promise<void> => {
    // filter
    const fillableColumns = [ 'to_chain', 'to_token_symbol', 'to_token_address', 'quick_amount' ];
    const filtered = _.pick(updateParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ');

    const query = `UPDATE ${table} SET ${params} WHERE id = ${id}`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);
}

// delete (soft delete?)
// export const delete = async(userId: number) => {
//     const query = `DELETE FROM ${table} WHERE user_id = ${userId}`;

//     const db = new DB();
//     await db.executeQueryForSingleResult(query);

//     return result;
// }
