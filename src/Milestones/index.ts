import DB from "../DB"
import {
    formatDBParamsToStr, getAssetUrl, convertBigIntToString, getPeriod
} from '../../utils';
import _ from "lodash";
import dayjs from "dayjs";
import { io } from '../../index';
import { Milestone } from "./types";

import * as UserController from '../Users/index';
import * as StylesController from '../OverlayStyles/index';
import * as PaymentController from '../Payments/index';

const table = 'stream_milestones';

// init entry for user
export const init = async(user_id: number) => {
    const defaultStyle = { font_type: '', font_size: '', font_color: '', bg_color: '', bg_image: '', bar_empty_color: '', bar_filled_color: '', position: 'middle-center', };

    return await create({
        user_id: user_id,
        title: '',
        target: '1000.00',
        start_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        end_at: dayjs().add(1, 'years').format('YYYY-MM-DD HH:mm:ss'),
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
        // get curr donated amount & milestone percentage
        const currAmount = await profit(result.user_id);
        result.profit = currAmount;
        result.percent = Number(currAmount) === 0 || Number(result.target) === 0 ? 0 : Math.round((Number(currAmount) / Number(result.target) * 100 * 100) / 100);

        // merge style data
        const style = await StylesController.view(result.style_id);
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
            // get curr donated amount & milestone percentage
            const currAmount = await profit(result![k].user_id);
            result![k].profit = currAmount;
            result![k].percent = Number(currAmount) === 0 || Number(result![k].target) === 0 ? 0 : Math.round((Number(currAmount) / Number(result![k].target) * 100 * 100) / 100);

            // merge style data
            const style = await StylesController.view(result![k].style_id);
            _.merge(result![k], style);
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
            // get curr donated amount & milestone percentage
            const currAmount = await profit(result![k].user_id);
            result![k].profit = currAmount;
            result![k].percent = Number(currAmount) === 0 || Number(result![k].target) === 0 ? 0 : Math.round((Number(currAmount) / Number(result![k].target) * 100 * 100) / 100);

            // merge style data
            const style = await StylesController.view(result![k].style_id);
            _.merge(result![k], style);
        })
    );

    return result as Milestone[] ?? [];
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
    const fillableColumns = ['title', 'target', 'start_at', 'end_at', 'timeframe', 'status'];
    const filtered = _.pick(updateParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ');

    const query = `UPDATE ${table} SET ${params} WHERE id = ${id}`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);

    await updateIO(qr.user_id, id);
}

// delete (soft delete?)
// export const remove = async(id: number) => {
//     const query = `UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${id}`;

//     const db = new DB();
//     await db.executeQueryForSingleResult(query);
// }

// update io
export const updateIO = async(userId: number, topicId: number) => {
    const user = await UserController.view(userId);
    const topic = await view(topicId);

    io.to(`studio_${user.wallet}`).emit('update', { milestone: convertBigIntToString(topic) });
}

// get profit
export const profit = async(userId: number): Promise<string> => {
    const db = new DB();
    const query = `SELECT * FROM ${table} WHERE user_id = ${userId}`;
    const milestone: Milestone | undefined = await db.executeQueryForSingleResult(query);

    if (!milestone) {
        return '0.00';
    }

    // get milestone type
    const { start, end } = getPeriod(milestone!.timeframe);

    const txns = await PaymentController.where([
        { field: 'created_at', cond: '>=', value: start },
        { field: 'created_at', cond: '<=', value: end },
        { field: 'to_user', cond: '=', value: userId }
    ]);

    const amount = _.reduce(txns, (result, value, key) => {
        // currently we add up amount from tx (pending, success)
        // make changes here if we want to count (success) tx only
        const amount = value.status === 'failed' ? 0 : Number(value.usd_worth);
        return result + amount;
    }, 0)
    return amount.toFixed(2);
}