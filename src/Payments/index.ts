import DB from "../DB"
import {
    formatDBParamsToStr,
} from '../../utils';
import _ from "lodash";
import { Payment } from "./types";

const table = 'stream_payments';

// create
export const create = async(insertParams: any): Promise<void> => {
    const fillableColumns = [ 'from_user', 'from_wallet', 'from_chain', 'from_token_symbol', 'from_token_address', 'from_amount', 'to_user', 'to_wallet', 'to_chain', 'to_token_symbol', 'to_token_address', 'to_amount', 'tx_hash', 'usd_worth' ];
    const params = formatDBParamsToStr(_.pick(insertParams, fillableColumns), ', ', true);

    // put quote
    const insertColumns = Object.keys(insertParams);

    const query = `INSERT INTO ${table} (${_.join(insertColumns, ', ')}) VALUES (${params}) RETURNING id`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);
}

// view (single - user_id)
export const view = async(userId: number): Promise<Payment> => {
    const query = `SELECT * FROM ${table} WHERE id = ${userId} LIMIT 1`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);

    return result;
}

// find (single - field)
export const find = async(whereParams: {[key: string]: any}): Promise<Payment[]> => {
    const params = formatDBParamsToStr(whereParams, ' AND ');
    const query = `SELECT * FROM ${table} WHERE ${params}`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    return result as Payment[];
}

// list (all)
export const list = async(): Promise<Payment[]> => {
    const query = `SELECT * FROM ${table}`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    return result as Payment[];
}

// update
export const update = async(id: number, updateParams: {[key: string]: any}): Promise<void> => {
    // filter
    const fillableColumns = ['status'];
    const params = formatDBParamsToStr(_.pick(_.pick(updateParams, fillableColumns), fillableColumns), ', ');

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
