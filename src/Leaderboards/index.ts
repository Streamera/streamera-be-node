import DB from "../DB"
import {
    formatDBParamsToStr, getAssetUrl, convertBigIntToString
} from '../../utils';
import _ from "lodash";
import { io } from '../../index';
import { Leaderboard } from "./types";
import moment from 'moment';

import * as UserController from '../Users/index';
import * as PaymentController from '../Payments/index';
import * as StylesController from '../OverlayStyles/index';

const table = 'stream_leaderboards';

// init entry for user
export const init = async(user_id: number) => {
    const defaultStyle = { font_type: '', font_size: '', font_color: '', bg_color: '', bg_image: '', bar_empty_color: '', bar_filled_color: '', position: 'middle-center', };

    return await create({
        user_id: user_id,
        title: '',
        status: "inactive",
        timeframe: 'weekly',
        ...defaultStyle
    });
}

// create
export const create = async(insertParams: any): Promise<{[id: string]: number}> => {
    const db = new DB();

    // insert style
    const style = await StylesController.create(insertParams);
    insertParams['style_id'] = style.id;

    // get Leaderboard insert field
    const fillableColumns = [ 'user_id', 'title', 'style_id', 'status', 'timeframe' ];
    const filtered = _.pick(insertParams, fillableColumns);

    const params = formatDBParamsToStr(filtered, ', ', true);
    const insertColumns = Object.keys(filtered);

    // insert into Leaderboard table
    const query = `INSERT INTO ${table} (${_.join(insertColumns, ',')}) VALUES (${params}) RETURNING id`;
    const result = await db.executeQueryForSingleResult(query);

    return result;
}

// view (single - id)
export const view = async(id: number): Promise<Leaderboard> => {
    const query = `SELECT * FROM ${table} WHERE id = ${id} LIMIT 1`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);

    if (result) {
        const style = await StylesController.view(result.style_id);

        // merge
        _.merge(result, style);

        const aggregate = await PaymentController.leaderboard(result.user_id, result.timeframe);
        result.top_donators = aggregate;
    }

    return result ?? {};
}

// find (all match)
export const find = async(whereParams: {[key: string]: any}) => {
    const params = formatDBParamsToStr(whereParams, ' AND ');
    const query = `SELECT * FROM ${table} WHERE ${params}`;

    const db = new DB();
    const result = await db.executeQueryForResults<Leaderboard>(query);

    await Promise.all(
        _.map(result, async(r, k) => {
            const style = await StylesController.view(result![k].style_id);

            // merge
            _.merge(result![k], style);

            const aggregate = await PaymentController.leaderboard(result![k].user_id, result![k].timeframe);
            result![k].top_donators = aggregate;
        })
    );

    return result ?? [];
}

// list (all)
export const list = async(): Promise<Leaderboard[]> => {
    const query = `SELECT * FROM ${table}`;

    const db = new DB();
    const result: Leaderboard[] | undefined = await db.executeQueryForResults(query);

    await Promise.all(
        _.map(result, async(r, k) => {
            const style = await StylesController.view(result![k].style_id);

            _.merge(result![k], style);
        })
    );

    return result as Leaderboard[] ?? [];
}

// update
export const update = async(id: number, updateParams: {[key: string]: any}): Promise<void> => {
    const qr = await view(id);

    const users = await UserController.find({ id: qr.user_id, signature: updateParams.signature });
    if(users.length === 0) {
        throw Error("Unauthorized!");
    }

    // update style
    await StylesController.update(qr.style_id, updateParams);

    // filter
    const fillableColumns = ['title', 'status', 'timeframe'];
    const filtered = _.pick(updateParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ');

    const query = `UPDATE ${table} SET ${params} WHERE id = ${id}`;

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

    io.to(`studio_${user.wallet}`).emit('update', { leaderboard: convertBigIntToString(topic) });
}