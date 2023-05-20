import DB from "../DB"
import {
    formatDBParamsToStr, getAssetUrl, convertBigIntToString
} from '../../utils';
import _ from "lodash";
import dayjs from "dayjs";
import { io } from '../../index';
import { Announcement } from "./types";

import * as UserController from '../Users/index';
import * as StylesController from '../OverlayStyles/index';

const table = 'stream_announcements';
const ignoreSoftDeleted = 'deleted_at IS NULL';

// init entry for user
export const init = async(user_id: number) => {
    const defaultStyle = { font_type: '', font_size: '', font_color: '', bg_color: '', bg_image: '', bar_empty_color: '', bar_filled_color: '', position: 'middle-center', };

    return await create({
        user_id: user_id,
        content: '',
        speed: 500,
        start_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        end_at: dayjs().add(99, 'years').format('YYYY-MM-DD HH:mm:ss'),
        status: 'inactive',
        ...defaultStyle
    });
}

// create
export const create = async(insertParams: any): Promise<{[id: string]: number}> => {
    const db = new DB();

    // insert style
    const style = await StylesController.create(insertParams);
    insertParams['style_id'] = style.id;

    // get Announcement insert field
    const fillableColumns = [ 'user_id', 'style_id', 'content', 'speed', 'start_at', 'end_at', 'status' ];
    const filtered = _.pick(insertParams, fillableColumns);

    const params = formatDBParamsToStr(filtered, ', ', true);
    const insertColumns = Object.keys(filtered);

    // insert into Announcement table
    const query = `INSERT INTO ${table} (${_.join(insertColumns, ',')}) VALUES (${params}) RETURNING id`;
    const result = await db.executeQueryForSingleResult(query);

    return result;
}

// view (single - id)
export const view = async(id: number): Promise<Announcement> => {
    const query = `SELECT * FROM ${table} WHERE ${ignoreSoftDeleted} AND id = ${id} LIMIT 1`;

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
export const find = async(whereParams: {[key: string]: any}): Promise<Announcement[]> => {
    const params = formatDBParamsToStr(whereParams, ' AND ');
    const query = `SELECT * FROM ${table} WHERE ${ignoreSoftDeleted} AND ${params}`;

    const db = new DB();
    const result: Announcement[] | undefined = await db.executeQueryForResults(query);

    await Promise.all(
        _.map(result, async(r, k) => {
            const style = await StylesController.view(result![k].style_id);

            // merge
            _.merge(result, style);
        })
    );

    return result as Announcement[] ?? [];
}

// list (all)
export const list = async(): Promise<Announcement[]> => {
    const query = `SELECT * FROM ${table} WHERE ${ignoreSoftDeleted}`;

    const db = new DB();
    const result: Announcement[] | undefined = await db.executeQueryForResults(query);

    await Promise.all(
        _.map(result, async(r, k) => {
            const style = await StylesController.view(result![k].style_id);

            _.merge(result![k], style);
        })
    );

    return result as Announcement[] ?? [];
}

// update
export const update = async(id: number, updateParams: {[key: string]: any}): Promise<void> => {
    const qr = await view(id);

    // update style
    await StylesController.update(qr.style_id, updateParams);

    // filter
    const fillableColumns = ['content', 'speed', 'start_at', 'end_at', 'status'];
    const filtered = _.pick(updateParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ');

    const query = `UPDATE ${table} SET ${params} WHERE ${ignoreSoftDeleted} AND id = ${id}`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);

    await updateIO(qr.user_id, id);
}

// delete (soft delete?)
export const remove = async(id: number) => {
    const query = `UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${id}`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);
}

// update io
export const updateIO = async(userId: number, topicId: number) => {
    const user = await UserController.view(userId);
    const topic = await view(topicId);

    io.to(`studio_${user.wallet}`).emit('update', { announcement: convertBigIntToString(topic) });
}