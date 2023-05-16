import DB from "../DB"
import {
    formatDBParamsToStr,
} from '../../utils';
import _ from "lodash";
import { User } from "./types";

const table = 'users';

// create
export const create = async(insertParams: any): Promise<void> => {
    const fillableColumns = [ 'name', 'wallet', 'signature', 'profile_picture' ];
    const params = formatDBParamsToStr(_.pick(insertParams, fillableColumns), ', ', true);

    // put quote
    const insertColumns = Object.keys(insertParams);

    const query = `INSERT INTO ${table} (${_.join(insertColumns, ', ')}) VALUES (${params}) RETURNING id`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);
}

// view (single - user_id)
export const view = async(id: number): Promise<User> => {
    const query = `SELECT * FROM ${table} WHERE id = ${id} LIMIT 1`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);

    return result;
}

// find (single - field)
export const find = async(whereParams: {[key: string]: any}): Promise<User[]> => {
    const params = formatDBParamsToStr(whereParams, ' AND ');
    const query = `SELECT * FROM ${table} WHERE status = 'active' AND ${params}`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    return result as User[];
}

// list (all)
export const list = async(): Promise<User[]> => {
    const query = `SELECT * FROM ${table} WHERE status = 'active'`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    return result as User[];
}

// update
export const update = async(id: number, updateParams: {[key: string]: any}): Promise<void> => {
    // filter
    const fillableColumns = ['name', 'signature', 'profile_picture'];
    const params = formatDBParamsToStr(_.pick(_.pick(updateParams, fillableColumns), fillableColumns), ', ');

    const query = `UPDATE ${table} SET ${params} WHERE id = ${id} AND status = 'active'`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);
}

// delete (soft delete?)
// export const delete = async(userId: number) => {
//     const query = `DELETE FROM users WHERE user_id = ${userId}`;

//     const db = new DB();
//     const result = await db.executeQueryForSingleResult(query);

//     return result;
// }
