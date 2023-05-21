import DB from "../DB"
import {
    formatDBParamsToStr, getAssetUrl,
} from '../../utils';
import _ from "lodash";
import { Trigger } from "./types";
import * as StylesController from '../OverlayStyles/index';

const table = 'stream_triggers';
const ignoreSoftDeleted = 'deleted_at IS NULL';


// init entry for user
export const init = async(user_id: number) => {
    const defaultStyle = { font_type: '', font_size: '', font_color: '', bg_color: '', bg_image: '', bar_empty_color: '', bar_filled_color: '', position: 'middle-center', };

    return await create({
        user_id: user_id,
        content: '',
        caption: '{{donator}}: {{amount}}',
        status: 'inactive',
        type: 'alltime',
        ...defaultStyle
    });
}

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

// view (single - id)
export const view = async(id: number): Promise<Trigger> => {
    const query = `SELECT * FROM ${table} WHERE ${ignoreSoftDeleted} AND id = ${id} LIMIT 1`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);

    if (result) {
        result.content = result.content ? getAssetUrl(result.content) : null;
        const style = await StylesController.view(result.style_id);

        // merge
        _.merge(result, style);
    }

    return result ?? {};
}

// find (all match)
export const find = async(whereParams: {[key: string]: any}): Promise<Trigger[]> => {
    const params = formatDBParamsToStr(whereParams, ' AND ', false, "a");
    const query = `SELECT a.*, s.id as overlay_id, s.font_type, s.font_size, s.font_color, s.bg_color, s.bg_image, s.bar_empty_color, s.bar_filled_color, s.position FROM ${table} a JOIN overlay_styles s ON s.id = a.style_id  WHERE ${ignoreSoftDeleted} AND ${params}`;

    const db = new DB();
    const result: Trigger[] | undefined = await db.executeQueryForResults(query);

    await Promise.all(
        _.map(result, async(r, k) => {
            result![k].content = getAssetUrl(result![k].content);
            const style = await StylesController.view(result![k].style_id);

            // merge
            _.merge(result, style);
        })
    );

    return result as Trigger[] ?? [];
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

// update (triggerId)
export const update = async(id: number, updateParams: {[key: string]: any}): Promise<void> => {
    const qr = await view(id);

    // update style
    await StylesController.update(qr.style_id, updateParams);

    // filter
    const fillableColumns = ['content', 'caption', 'status', 'type'];
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
