import DB from "../DB"
import {
    formatDBParamsToStr, getAssetUrl,
} from '../../utils';
import _ from "lodash";
import { Milestone } from "./types";
import * as StylesController from '../OverlayStyles/index';

const table = 'stream_milestones';

// create
export const create = async(insertParams: any): Promise<{[id: string]: number}> => {
    const db = new DB();

    // insert style
    const style = await StylesController.create(insertParams);
    console.log(style);
    insertParams['style_id'] = style.id;

    // get Milestone insert field
    const fillableColumns = [ 'user_id', 'title', 'target', 'style_id', 'start_at', 'end_at', 'timeframe' ];
    const filtered = _.pick(insertParams, fillableColumns);

    const params = formatDBParamsToStr(filtered, ', ', true);
    const insertColumns = Object.keys(filtered);

    // insert into Milestone table
    const query = `INSERT INTO ${table} (${_.join(insertColumns, ',')}) VALUES (${params}) RETURNING id`;
    const result = await db.executeQueryForSingleResult(query);

    return result;
}

// view (single - id)
export const view = async(id: number): Promise<Milestone> => {
    const query = `SELECT * FROM ${table} WHERE id = ${id} LIMIT 1`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);

    if (result) {
        const style = await StylesController.view(result.style_id);

        // merge
        _.merge(result, style);
    }

    return result ?? {};
}

// find (all match)
export const find = async(whereParams: {[key: string]: any}): Promise<Milestone[]> => {
    const params = formatDBParamsToStr(whereParams, ' AND ');
    const query = `SELECT * FROM ${table} WHERE ${params}`;

    const db = new DB();
    const result: Milestone[] | undefined = await db.executeQueryForResults(query);

    await Promise.all(
        _.map(result, async(r, k) => {
            const style = await StylesController.view(result![k].style_id);

            // merge
            _.merge(result, style);
        })
    );

    return result as Milestone[] ?? [];
}

// list (all)
export const list = async(): Promise<Milestone[]> => {
    const query = `SELECT * FROM ${table}`;

    const db = new DB();
    const result: Milestone[] | undefined = await db.executeQueryForResults(query);

    await Promise.all(
        _.map(result, async(r, k) => {
            const style = await StylesController.view(result![k].style_id);

            _.merge(result![k], style);
        })
    );

    return result as Milestone[] ?? [];
}

// update
export const update = async(id: number, updateParams: {[key: string]: any}): Promise<void> => {
    const qr = await view(id);

    // update style
    await StylesController.update(qr.style_id, updateParams);

    // filter
    const fillableColumns = ['title', 'target', 'start_at', 'end_at', 'timeframe'];
    const filtered = _.pick(updateParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ');

    const query = `UPDATE ${table} SET ${params} WHERE id = ${id}`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);
}

// delete (soft delete?)
export const remove = async(id: number) => {
    const query = `UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${id}`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);
}
