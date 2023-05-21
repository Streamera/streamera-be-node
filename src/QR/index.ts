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

// init entry for user
export const init = async(user_id: number) => {
    const defaultStyle = { font_type: '', font_size: '', font_color: '', bg_color: '', bg_image: '', bar_empty_color: '', bar_filled_color: '', position: 'middle-center', };

    return await create({
        user_id: user_id,
        status: 'inactive',
        ...defaultStyle
    });
}

// create
export const create = async(insertParams: any): Promise<{[id: string]: number}> => {
    const db = new DB();

    // get user details
    const user = await UserController.view(insertParams.user_id);

    // generate QR
    const qrFile = `${uuidv4()}.png`;
    await QRCode.toFile(path.join(AppRoot.toString(), `/public/content/${qrFile}`), `${user.wallet}`);
    insertParams['qr'] = qrFile;

    // insert style
    const style = await StylesController.create(insertParams);
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

// view (single - id)
export const view = async(id: number): Promise<QR> => {
    const query = `SELECT * FROM ${table} WHERE id = ${id} LIMIT 1`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);

    if (result) {
        result.qr = getAssetUrl(result.qr);
        const style = await StylesController.view(result.style_id);

        _.merge(result, style);
    }

    return result ?? {};
}

// find (all match)
export const find = async(whereParams: {[key: string]: any}): Promise<QR[]> => {
    const params = formatDBParamsToStr(whereParams, ' AND ');
    const query = `SELECT * FROM ${table} WHERE ${params}`;

    const db = new DB();
    const result: QR[] | undefined = await db.executeQueryForResults(query);

    await Promise.all(
        _.map(result, async(r, k) => {
            result![k].qr = getAssetUrl(result![k].qr);
            const style = await StylesController.view(result![k].style_id);

            _.merge(result![k], style);
        })
    );

    return result as QR[] ?? [];
}

// list (all)
export const list = async(): Promise<QR[]> => {
    const query = `SELECT * FROM ${table}`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    _.map(result, (r, k) => {
        result![k].qr = getAssetUrl(result![k].qr);
    })

    return result as QR[] ?? [];
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
    const fillableColumns = ['qr', 'status'];
    const filtered = _.pick(updateParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ');

    const query = `UPDATE ${table} SET ${params} WHERE id = ${id}`;

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
