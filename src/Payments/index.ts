import DB from "../DB"
import {
    formatDBParamsToStr, convertBigIntToString, customDBWhereParams, ellipsizeThis
} from '../../utils';
import _ from "lodash";
import { io } from '../../index';
import { Payment, PaymentAggregate } from "./types";

import * as UserController from '../Users/index';
import * as TriggerController from '../Triggers/index';
import * as MilestoneController from '../Milestones/index';
import * as LeaderboardController from '../Leaderboards/index';
import { LeaderboardTimeframe } from "../Leaderboards/types";

import moment from 'moment';

const table = 'stream_payments';

// create
export const create = async(insertParams: any): Promise<{[id: string]: number}> => {
    const fillableColumns = [ 'from_user', 'from_wallet', 'from_chain', 'from_token_symbol', 'from_token_address', 'from_amount', 'to_user', 'to_wallet', 'to_chain', 'to_token_symbol', 'to_token_address', 'to_amount', 'tx_hash', 'usd_worth' ];

    const filtered = _.pick(insertParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ', true);

    // put quote
    const insertColumns = Object.keys(filtered);

    const query = `INSERT INTO ${table} (${_.join(insertColumns, ', ')}) VALUES (${params}) RETURNING id`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);

    if (result) {
        await updateIO(filtered.to_user, result.id);
        return result;
    } else {
        return {};
    }

}

// view (single - id)
export const view = async(id: number): Promise<Payment> => {
    const query = `SELECT * FROM ${table} WHERE id = ${id} LIMIT 1`;

    const db = new DB();
    const result = await db.executeQueryForSingleResult(query);

    return result ?? {};
}

// find (all match)
export const find = async(whereParams: {[key: string]: any}): Promise<Payment[]> => {
    const params = formatDBParamsToStr(whereParams, ' AND ');
    const query = `SELECT * FROM ${table} WHERE ${params}`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    return result as Payment[] ?? [];
}

export const leaderboard = async(user_id: number, timeframe: LeaderboardTimeframe ) => {
    let timeWhere = '';

    switch(timeframe) {
        case "daily":
            timeWhere = `p.created_at between '${moment().format('YYYY-MM-DD')} 00:00:00' and '${moment().format('YYYY-MM-DD')} 23:59:59'`;
            break;
        case "weekly":
            let thisWeekStart = moment().startOf('week').format('YYYY-MM-DD HH:mm:ss');
            let thisWeekEnd = moment().endOf('week').format('YYYY-MM-DD HH:mm:ss');
            timeWhere = `p.created_at between '${thisWeekStart}' and '${thisWeekEnd}'`;
            break;
        case "monthly":
            let thisMonthStart = moment().startOf('month').format('YYYY-MM-DD HH:mm:ss');
            let thisMonthEnd = moment().endOf('month').format('YYYY-MM-DD HH:mm:ss');
            timeWhere = `p.created_at between '${thisMonthStart}' and '${thisMonthEnd}'`;
            break;
        default:
            // all time is defualt
            timeWhere = '1=1';
            break;
    }
    const query = `
        SELECT 
            p.from_wallet, 
            case 
            when u.display_name = '' or u.display_name is null then p.from_wallet
            else u.display_name 
            end as name, 
            sum(coalesce(p.usd_worth, 0)) as amount_usd 
        FROM ${table} p 
        left join users u on u.id = p.from_user 
        WHERE to_user = ${user_id}
          AND ${timeWhere}
        GROUP BY 1,2
        ORDER BY 3 DESC
        LIMIT 5`;

    const db = new DB();
    const result = await db.executeQueryForResults<PaymentAggregate>(query);
    return result ?? [];
}

// list (all)
export const list = async(): Promise<Payment[]> => {
    const query = `SELECT * FROM ${table}`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    return result as Payment[] ?? [];
}

// update
export const update = async(id: number, updateParams: {[key: string]: any}): Promise<void> => {
    // filter
    const fillableColumns = ['status'];
    const filtered = _.pick(updateParams, fillableColumns);
    const params = formatDBParamsToStr(filtered, ', ');

    const query = `UPDATE ${table} SET ${params} WHERE id = ${id}`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);
}

// update io
export const updateIO = async(userId: number, topicId: number) => {
    const user = await UserController.view(userId);
    const payment = await view(topicId);
    const trigger = await TriggerController.find({ user_id: userId });
    const topic3 = await MilestoneController.find({ user_id: userId });
    const leaderboard = await LeaderboardController.find({ user_id: userId });
    const donator = await UserController.view(payment.from_user);

    // sometimes there will be no user
    if(trigger.length === 0){
        return;
    }

    let donatorName = ellipsizeThis(payment.from_wallet, 10, 0);

    if(donator.name) {
        donatorName = donator.name;
    }

    let message = trigger?.[0].caption.replace(/{{donator}}/g, donatorName).replace(/{{amount}}/g, `$${payment.usd_worth}`);
    
    io.to(`studio_${user.wallet}`).emit('update', { milestone:  convertBigIntToString(topic3?.[0]), leaderboard: convertBigIntToString(leaderboard?.[0]) });
    io.to(`studio_${user.wallet}`).emit('payment', message);
}

// where (with condition)
export const where = async(whereParams: { field: string, cond: string, value: any }[]): Promise<Payment[]> => {
    const whereString = customDBWhereParams(whereParams);
    const query = `SELECT * FROM ${table} WHERE ${whereString}`;

    const db = new DB();
    const result = await db.executeQueryForResults(query);

    return result as Payment[] ?? [];
}


// delete (soft delete?)
// export const delete = async(userId: number) => {
//     const query = `DELETE FROM ${table} WHERE user_id = ${userId}`;

//     const db = new DB();
//     await db.executeQueryForSingleResult(query);

//     return result;
// }
