import DB from "../DB"
import {
    formatDBParamsToStr,
    getInsertQuery
} from '../../utils';
import _ from "lodash";
import { User } from "./types";

// create
export const create = async(insertParams: any): Promise<void> => {
    const fillableColumns = [ 'name', 'wallet', 'signature', 'profile_picture' ];
    const params = formatDBParamsToStr(_.pick(insertParams, fillableColumns), ', ', true);

    // put quote
    const insertColumns = Object.keys(insertParams);

    const query = `INSERT INTO users (${_.join(insertColumns, ', ')}) VALUES (${params}) RETURNING id`;
    console.log(query);

    const db = new DB();
    await db.executeQueryForSingleResult(query);
}

// view (single - user_id)
export const view = async(userId: number): Promise<User> => {
    const query = `SELECT * FROM users WHERE id = ${userId} LIMIT 1`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);

    console.log(result);
    return result;
}

// find (single - field)
export const find = async(whereParams: {[key: string]: any}): Promise<User[]> => {
    const params = formatDBParamsToStr(whereParams, ' AND ');
    console.log(whereParams);
    const query = `SELECT * FROM users WHERE status = 'active' AND ${params}`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    console.log(result);
    return result as User[];
}

// list (all)
export const list = async(): Promise<User[]> => {
    const query = `SELECT * FROM users WHERE status = 'active'`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    console.log(result);
    return result as User[];
}

// update
export const update = async(updateParams: {[key: string]: any}): Promise<void> => {
    // filter
    const fillableColumns = ['name', 'signature', 'profile_picture'];
    const params = formatDBParamsToStr(_.pick(_.pick(updateParams, fillableColumns), fillableColumns), ', ');

    const query = `UPDATE users SET ${params} WHERE status = 'active'`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);
}

// delete (soft delete?)
// export const delete = async(userId: number) => {
//     const query = `DELETE FROM users WHERE user_id = ${userId}`;

//     const db = new DB();
//     const result = await db.executeQueryForSingleResult(query);

//     console.log(result);
//     return result;
// }
