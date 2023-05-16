import DB from "../DB"
import {
    formatDBParamsToStr,
} from '../../utils';
import _ from "lodash";
import { Streams } from "./types";

const table = 'streams';

// create
export const create = async(insertParams: any): Promise<void> => {
    const fillableColumns = [ 'user_id', 'title', 'description', 'thumbnail', 'start_at', 'end_at', 'status' ];
    const params = formatDBParamsToStr(_.pick(insertParams, fillableColumns), ', ', true);

    // put quote
    const insertColumns = Object.keys(insertParams);

    const query = `INSERT INTO ${table} (${_.join(insertColumns, ', ')}) VALUES (${params}) RETURNING id`;
    console.log(query);

    const db = new DB();
    return await db.executeQueryForSingleResult(query);
}

// view (single - user_id)
export const view = async(userId: number): Promise<Streams> => {
    const query = `SELECT * FROM ${table} WHERE deleted_at IS NULL AND id = ${userId} LIMIT 1`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);

    return result;
}

// find (single - field)
export const find = async(whereParams: {[key: string]: any}): Promise<Streams[]> => {
    const params = formatDBParamsToStr(whereParams, ' AND ');
    const query = `SELECT * FROM ${table} WHERE deleted_at IS NULL AND ${params}`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    return result as Streams[];
}

// list (all)
export const list = async(): Promise<Streams[]> => {
    const query = `SELECT * FROM ${table}`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    return result as Streams[];
}

// update
export const update = async(id: number, updateParams: {[key: string]: any}): Promise<void> => {
    // filter
    const fillableColumns = ['title', 'description', 'thumbnail', 'start_at', 'end_at', 'status'];
    const params = formatDBParamsToStr(_.pick(_.pick(updateParams, fillableColumns), fillableColumns), ', ');

    const query = `UPDATE ${table} SET ${params} WHERE deleted_at IS NULL AND id = ${id}`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);
}

// delete (soft delete)
export const remove = async(id: number) => {
    const query = `UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${id}`;

    const db = new DB();
    await db.executeQuery(query);
}
