import DB from "../DB"
import {
    formatDBParamsToStr, getAssetUrl, convertBigIntToString
} from '../../utils';
import _ from "lodash";
import { io } from '../../index';

import { Trigger } from "./types";
import * as UserController from '../Users/index';
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
    const params = formatDBParamsToStr(whereParams, ' AND ');
    const query = `SELECT * FROM ${table} WHERE ${ignoreSoftDeleted} AND ${params}`;

    const db = new DB();
    const result: Trigger[] | undefined = await db.executeQueryForResults(query);

    await Promise.all(
        _.map(result, async(r, k) => {
            result![k].content = result![k].content ? getAssetUrl(result![k].content) : "";
            const style = await StylesController.view(result![k].style_id);

            // merge
            _.merge(result![k], style);
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

    const users = await UserController.find({ id: qr.user_id, signature: updateParams.signature });
    if(users.length === 0) {
        throw Error("Unauthorized!");
    }

    // update style
    await StylesController.update(qr.style_id, updateParams);

    // filter
    const fillableColumns = ['content', 'caption', 'status', 'type'];
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

export const demo = async(userId: number) => {
    const user = await UserController.view(userId);
    const trigger = await find({ user_id: userId });

    if (trigger.length === 0) {
        return;
    }

    // random name
    const donors = ['greengre', 'kiiida', 'ccccyris', 'waaatever', 'iluvpepe', 'loldogeee', 'squidrox', 'axelaeerr'];
    const randIdx = Math.floor(Math.random() * donors.length);
    const demoAmount = Math.floor(Math.random() * 1000);

    let message = trigger?.[0].caption.replace(/{{donator}}/g, donors[randIdx]).replace(/{{amount}}/g, `$${demoAmount}`);

    io.to(`studio_${user.wallet}`).emit('payment', message);
}

// update io
export const updateIO = async(userId: number, topicId: number) => {
    const user = await UserController.view(userId);
    const topic = await view(topicId);

    io.to(`studio_${user.wallet}`).emit('update', { trigger: convertBigIntToString(topic) });
}