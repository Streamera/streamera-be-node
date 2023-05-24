import DB from "../DB"
import {
    convertBigIntToString,
    formatDBParamsToStr,
} from '../../utils';
import _ from "lodash";
import dayjs from "dayjs";
import { Poll } from "./types";
import { io } from '../../index';
import { PollOption } from "../PollOptions/types";
import * as UserController from '../Users/index';
import * as PollOptionsController from '../PollOptions/index';
import * as StylesController from '../OverlayStyles/index';

const table = 'stream_polls';

// init entry for user
export const init = async(user_id: number) => {
    const defaultStyle = { font_type: '', font_size: '', font_color: '', bg_color: '', bg_image: '', bar_empty_color: '', bar_filled_color: '', position: 'middle-center', };

    return await create({
        user_id: user_id,
        title: '',
        start_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        end_at: dayjs().add(99, 'years').format('YYYY-MM-DD HH:mm:ss'),
        status: "inactive",
        options: [],
        ...defaultStyle
    });
}

// create
export const create = async(insertParams: any): Promise<{[id: string]: number}> => {
    const db = new DB();

    // insert style
    const style = await StylesController.create(insertParams);
    insertParams['style_id'] = style.id;

    // get Poll insert field
    const fillableColumns = [ 'user_id', 'status', 'title', 'style_id', 'start_at', 'end_at' ];
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

        const style = await StylesController.view(result.style_id);
        // merge
        _.merge(result, style);
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

        let total = 0;
        if(options.length > 0) {
            total = options.map(x => x.total).reduce((a, b) => a + b);
        }
        result![k].total = total;

        const style = await StylesController.view(result![k].style_id);

        // merge
        _.merge(result![k], style);
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
    const qr = await view(id);
    const users = await UserController.find({ id: qr.user_id, signature: updateParams.signature });
    if(users.length === 0) {
        throw Error("Unauthorized!");
    }

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
    // update style
    await StylesController.update(qr.style_id, updateParams);

    // filter
    const fillableColumns = ['title', 'status', 'start_at', 'end_at'];
    const filtered = _.pick(updateParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ');

    const query = `UPDATE ${table} SET ${params} WHERE id = ${id}`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);

    const poll = await view(id);
    await updateIO(poll.user_id, id);
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

    io.to(`studio_${user.wallet}`).emit('update', { poll: convertBigIntToString(topic) });
}
