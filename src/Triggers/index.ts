import DB from "../DB"
import {
    formatDBParamsToStr, getAssetUrl,
} from '../../utils';
import _ from "lodash";
import { Trigger } from "./types";
import * as StylesController from '../OverlayStyles/index';

const table = 'stream_triggers';
const ignoreSoftDeleted = ' deleted_at IS NULL AND ';

// create
export const create = async(insertParams: any): Promise<{[id: string]: number}> => {
    const db = new DB();

    // insert style
    const style = await StylesController.create(insertParams);
    insertParams['style_id'] = style.id;

    // get trigger insert field
    const fillableColumns = [ 'user_id', 'style_id', 'content', 'type', 'status' ];
    const filtered = _.pick(insertParams, fillableColumns);

    const params = formatDBParamsToStr(filtered, ', ', true);
    const insertColumns = Object.keys(filtered);

    // insert into trigger table
    const query = `INSERT INTO ${table} (${_.join(insertColumns, ',')}) VALUES (${params}) RETURNING id`;
    const result = await db.executeQueryForSingleResult(query);

    return result;
}

// view (single - user_id)
export const view = async(userId: number): Promise<Trigger> => {
    const query = `SELECT * FROM ${table} WHERE ${ignoreSoftDeleted} user_id = ${userId} LIMIT 1`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);

    if (result) {
        result.qr = getAssetUrl(result.qr);
        const style = await StylesController.view(result.style_id);

        // merge
        _.merge(result, style);
    }

    return result;
}

// find (all match)
export const find = async(whereParams: {[key: string]: any}): Promise<Trigger[]> => {
    const params = formatDBParamsToStr(whereParams, ' AND ');
    const query = `SELECT * FROM ${table} WHERE ${ignoreSoftDeleted} ${params}`;

    const db = new DB();
    const result: Trigger[] | undefined = await db.executeQueryForResults(query);

    _.map(result, (r, k) => {
        result![k].content = getAssetUrl(result![k].content);
    })

    return result as Trigger[];
}

// list (all)
export const list = async(): Promise<Trigger[]> => {
    const query = `SELECT * FROM ${table} WHERE ${ignoreSoftDeleted}`;

    const db = new DB();
    const result: Trigger[] | undefined = await db.executeQueryForResults(query);

    await Promise.all(
        _.map(result, async(r, k) => {
            result![k].content = getAssetUrl(result![k].content);
            const style = await StylesController.view(result![k].style_id);

            _.merge(result![k], style);
        })
    );

    return result as Trigger[] ?? [];
}

// update
export const update = async(userId: number, updateParams: {[key: string]: any}): Promise<void> => {
    const qr = await view(userId);

    // update style
    await StylesController.update(qr.style_id, updateParams);

    // filter
    const fillableColumns = ['content', 'status', 'type'];
    const filtered = _.pick(updateParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ');

    const query = `UPDATE ${table} SET ${params} WHERE ${ignoreSoftDeleted} user_id = ${userId}`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);
}

// delete (soft delete?)
export const remove = async(triggerId: number) => {
    const query = `UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${triggerId}`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);
}
