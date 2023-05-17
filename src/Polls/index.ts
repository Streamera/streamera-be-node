import DB from "../DB"
import {
    convertBigIntToString,
    formatDBParamsToStr,
} from '../../utils';
import _ from "lodash";
import { Poll } from "./types";
import * as PollOptionsController from '../PollOptions/index';
import { PollOption } from "../PollOptions/types";

const table = 'stream_polls';

// create
export const create = async(insertParams: any): Promise<{[id: string]: number}> => {
    const db = new DB();

    // get Poll insert field
    const fillableColumns = [ 'user_id', 'stream_id', 'title', 'style_id', 'start_at', 'end_at' ];
    const filtered = _.pick(insertParams, fillableColumns);

    const params = formatDBParamsToStr(filtered, ', ', true);
    const insertColumns = Object.keys(filtered);

    // insert into Poll table
    const query = `INSERT INTO ${table} (${_.join(insertColumns, ',')}) VALUES (${params}) RETURNING id`;
    const result = await db.executeQueryForSingleResult(query);

    // insert into Options table
    await Promise.all(_.map(insertParams.options, async(opt) => {
        await PollOptionsController.create({ ...opt, 'poll_id': result.id });
    }));

    return result;
}

// view (single - id)
export const view = async(id: number): Promise<Poll> => {
    const query = `SELECT * FROM ${table} WHERE id = ${id} LIMIT 1`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);

    // get options
    if (result) {
        const options = await PollOptionsController.find({ poll_id: result.id });
        result.options = options;
    }

    return result ?? {};
}

// find (all match)
export const find = async(whereParams: {[key: string]: any}): Promise<Poll[]> => {
    const params = formatDBParamsToStr(whereParams, ' AND ');
    const query = `SELECT * FROM ${table} WHERE ${params}`;

    const db = new DB();
    const result: Poll[] | undefined = await db.executeQueryForResults(query);

    await Promise.all(_.map(result, async(r, k) => {
        const options = await PollOptionsController.find({ poll_id: result![k].id });
        result![k].options = options;
    }));

    return result as Poll[] ?? [];
}

// list (all)
export const list = async(): Promise<Poll[]> => {
    const query = `SELECT * FROM ${table}`;

    const db = new DB();
    const result: Poll[] | undefined = await db.executeQueryForResults(query);

    await Promise.all(_.map(result, async(r, k) => {
        const options = await PollOptionsController.find({ poll_id: result![k].id });
        result![k].options = options;
    }));

    return result as Poll[] ?? [];
}

// update
export const update = async(id: number, updateParams: {[key: string]: any}): Promise<void> => {
    // get inital options
    const prevOptions = await PollOptionsController.find({ poll_id: id });
    let prevOptionIds: any[] = [];
    _.map(prevOptions, (po: PollOption) => { prevOptionIds.push(po.id!); });
    prevOptionIds = convertBigIntToString(prevOptionIds);

    // insert / update options
    let updatedOpt: any = [];
    await Promise.all(_.map(updateParams.options, async(opt) => {
        const optIndex = prevOptionIds.indexOf(opt.id.toString());
        if (optIndex > -1 && opt.id != 0) {
            // update
            await PollOptionsController.update(opt.id, opt);
            updatedOpt.push(opt.id.toString());
        } else if (opt.id == 0) {
            // create
            await PollOptionsController.create({...opt, poll_id: id});
        }
    }));

    // remove options
    await Promise.all(_.map(prevOptionIds, async(opt) => {
        if (!(updatedOpt.indexOf(opt) > -1)) {
            await PollOptionsController.remove(opt);
        }
    }));

    // filter
    const fillableColumns = ['title', 'start_at', 'end_at'];
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
