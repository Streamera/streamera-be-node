import DB from "../DB"
import {
    formatDBParamsToStr,
} from '../../utils';
import _ from "lodash";
import { OverlayStyles } from "./types";

const table = 'overlay_styles';

// create
export const create = async(insertParams: any): Promise<{[id: string]: number}> => {
    const fillableColumns = [ 'font_type', 'font_size', 'font_color', 'bg_color', 'bg_image', 'bar_empty_color', 'bar_filled_color', 'position' ];
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
export const view = async(id: number): Promise<OverlayStyles> => {
    const query = `SELECT * FROM ${table} WHERE id = ${id} LIMIT 1`;

    const db = new DB();
    let result = await db.executeQueryForSingleResult(query);
    result = _.omit(result, ['id', 'created_at', 'updated_at']);

    return result ?? {};
}

// find (all match)
export const find = async(whereParams: {[key: string]: any}): Promise<OverlayStyles[]> => {
    const params = formatDBParamsToStr(whereParams, ' AND ');
    const query = `SELECT * FROM ${table} WHERE ${params}`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    return result as OverlayStyles[] ?? [];
}

// list (all)
export const list = async(): Promise<OverlayStyles[]> => {
    const query = `SELECT * FROM ${table}`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    return result as OverlayStyles[] ?? [];
}

// update
export const update = async(id: number, updateParams: {[key: string]: any}): Promise<void> => {
    // filter
    const fillableColumns = [ 'font_type', 'font_size', 'font_color', 'bg_color', 'bg_image', 'bar_empty_color', 'bar_filled_color', 'position' ];
    const filtered = _.pick(updateParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ');

    const query = `UPDATE ${table} SET ${params} WHERE id = ${id}`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);
}

// delete (soft delete?)
// export const delete = async(id: number) => {
//     const query = `DELETE FROM ${table} WHERE id = ${id}`;

//     const db = new DB();
//     await db.executeQueryForSingleResult(query);

//     return result;
// }
