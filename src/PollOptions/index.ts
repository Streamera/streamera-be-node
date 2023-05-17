import DB from "../DB"
import {
    formatDBParamsToStr, getAssetUrl,
} from '../../utils';
import _ from "lodash";
import { PollOption } from "./types";
import * as StylesController from '../OverlayStyles/index';

const table = 'stream_poll_options';
const ignoreSoftDeleted = 'deleted_at IS NULL';

// create
export const create = async(insertParams: any): Promise<{[id: string]: number}> => {
    const db = new DB();

    // get PollOption insert field
    const fillableColumns = [ 'poll_id', 'option' ];
    const filtered = _.pick(insertParams, fillableColumns);

    const params = formatDBParamsToStr(filtered, ', ', true);
    const insertColumns = Object.keys(filtered);

    // insert into PollOption table
    const query = `INSERT INTO ${table} (${_.join(insertColumns, ',')}) VALUES (${params}) RETURNING id`;
    const result = await db.executeQueryForSingleResult(query);

    return result;
}

// view (single - id)
export const view = async(id: number): Promise<PollOption> => {
    const query = `SELECT id, option FROM ${table} WHERE ${ignoreSoftDeleted} AND id = ${id} LIMIT 1`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);

    return result ?? {};
}

// find (all match)
export const find = async(whereParams: {[key: string]: any}): Promise<PollOption[]> => {
    const params = formatDBParamsToStr(whereParams, ' AND ');
    const query = `SELECT id, option FROM ${table} WHERE ${ignoreSoftDeleted} AND ${params}`;

    const db = new DB();
    const result: PollOption[] | undefined = await db.executeQueryForResults(query);

    return result as PollOption[] ?? [];
}

// list (all)
export const list = async(): Promise<PollOption[]> => {
    const query = `SELECT id, option FROM ${table} WHERE ${ignoreSoftDeleted}`;

    const db = new DB();
    const result: PollOption[] | undefined = await db.executeQueryForResults(query);

    return result as PollOption[] ?? [];
}

// update
export const update = async(id: number, updateParams: {[key: string]: any}): Promise<void> => {
    // filter
    const fillableColumns = ['option'];
    const filtered = _.pick(updateParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ');

    const query = `UPDATE ${table} SET ${params} WHERE ${ignoreSoftDeleted} AND id = ${id}`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);
}

// delete (soft delete?)
export const remove = async(id: number) => {
    const query = `UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${id}`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);
}
