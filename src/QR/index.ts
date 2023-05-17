import DB from "../DB"
import {
    formatDBParamsToStr, getAssetUrl,
} from '../../utils';
import _ from "lodash";
import { QR } from "./types";
import QRCode from 'qrcode';
import AppRoot from 'app-root-path';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as UserController from '../Users/index';
import * as StylesController from '../OverlayStyles/index';

const table = 'stream_qr';

// create
export const create = async(insertParams: any): Promise<void> => {
    const db = new DB();

    // get user details
    const user = await UserController.view(insertParams.user_id);

    // generate QR
    const qrFile = `${uuidv4()}.png`;
    await QRCode.toFile(path.join(AppRoot.toString(), `/public/content/${qrFile}`), `${user.wallet}`);
    insertParams['qr'] = qrFile;

    // insert style
    const style = await StylesController.create(insertParams);
    console.log(style);
    insertParams['style_id'] = style.id;

    // get qr insert field
    const fillableColumns = [ 'user_id', 'qr', 'style_id', 'status' ];
    const filtered = _.pick(insertParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ', true);
    const insertColumns = Object.keys(filtered);

    // insert into qr table
    const query = `INSERT INTO ${table} (${_.join(insertColumns, ', ')}) VALUES (${params}) RETURNING id`;
    const result = await db.executeQueryForSingleResult(query);

    return result;
}

// view (single - user_id)
export const view = async(userId: number): Promise<QR> => {
    const query = `SELECT * FROM ${table} WHERE user_id = ${userId} LIMIT 1`;

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
export const find = async(whereParams: {[key: string]: any}): Promise<QR[]> => {
    const params = formatDBParamsToStr(whereParams, ' AND ');
    const query = `SELECT * FROM ${table} WHERE ${params}`;

    const db = new DB();
    const result: QR[] | undefined = await db.executeQueryForResults(query);

    _.map(result, (r, k) => {
        result![k].qr = getAssetUrl(result![k].qr);
    })

    return result as QR[];
}

// list (all)
export const list = async(): Promise<QR[]> => {
    const query = `SELECT * FROM ${table}`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    return result as QR[];
}

// update
export const update = async(userId: number, updateParams: {[key: string]: any}): Promise<void> => {
    const qr = await view(userId);

    // update style
    await StylesController.update(qr.style_id, updateParams);

    // filter
    const fillableColumns = ['status'];
    const filtered = _.pick(updateParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ');

    const query = `UPDATE ${table} SET ${params} WHERE user_id = ${userId}`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);
}

// delete (soft delete?)
// export const delete = async(userId: number) => {
//     const query = `DELETE FROM ${table} WHERE user_id = ${userId}`;

//     const db = new DB();
//     await db.executeQueryForSingleResult(query);

//     return result;
// }
