import DB from "../DB"
import {
    convertBigIntToString,
    formatDBParamsToStr,
    getAssetUrl,
    getInsertQuery,
    getUpsertQuery
} from '../../utils';
import _ from "lodash";
import { io } from '../../index';
import { User } from "./types";

import * as announcementController from '../Announcements/index';
import * as donationSettingController from '../DonationSetting/index';
import * as qrController from '../QR/index';
import * as pollController from '../Polls/index';
import * as milestoneController from '../Milestones/index';
import * as leaderboardController from '../Leaderboards/index';
import * as triggerController from '../Triggers/index';
import * as webhookController from '../Webhooks/index';

const table = 'users';

// create
export const create = async(insertParams: any): Promise<{[id: string]: number}> => {
    const db = new DB();

    // insert user
    const fillableColumns = [ 'name', 'wallet', 'signature', 'profile_picture' ];
    const filtered = _.pick(insertParams, fillableColumns);
    // make wallet address to lower case
    filtered.wallet = filtered.wallet.toLowerCase();
    const params = formatDBParamsToStr(filtered, ', ', true);
    const insertColumns = Object.keys(filtered);

    const query = `INSERT INTO ${table} (${_.join(insertColumns, ', ')}) VALUES (${params}) RETURNING id`;
    const result = await db.executeQueryForSingleResult(query);

    // init announcement
    await announcementController.init(result.id);
    // init user_donation_setting
    await donationSettingController.init(result.id);
    // init qr
    await qrController.init(result.id);
    // init polls
    await pollController.init(result.id);
    // init milestone
    await milestoneController.init(result.id);
    // init leaderboard
    await leaderboardController.init(result.id);
    // init trigger?? (1)
    await triggerController.init(result.id);
    // init webhooks
    await webhookController.init(result.id);

    return result;
}

// view (single - user_id)
export const view = async(id: number): Promise<User> => {
    const db = new DB();

    // user table
    const query = `
        SELECT ${table}.*, d.to_chain, d.to_token_symbol, d.to_token_address
        FROM ${table}
        LEFT JOIN user_donation_setting d
        ON ${table}.id = d.user_id
        WHERE ${table}.id = ${id} AND status = 'active' LIMIT 1`;
    const result = await db.executeQueryForSingleResult(query);

    // return if no user found
    if (!result || result.length == 0) {
        return {} as User;
    }

    // user's social media table
    const socialQuery = `SELECT user_id, type, url FROM user_social_media WHERE user_id IN (${result.id})`;
    const socialResult =  await db.executeQueryForResults(socialQuery);

    // set social media into user's property
    const socialMedia: {[key: string]: any}  = {};
    const curr = _.filter(socialResult, {user_id: result.id})
    _.map(curr, (s) => {
        socialMedia[s.type] = s.url
    });

    // set profile pic url
    result.profile_picture = result.profile_picture ? getAssetUrl(result.profile_picture) : null;
    result.social = socialMedia;

    return result ?? {};
}

// find (all match)
export const find = async(whereParams: {[key: string]: any}): Promise<User[]> => {
    const db = new DB();

    // user table
    let whereParamsPrefixed: {[key: string]: any} = {};
    _.map(whereParams, (w, k) => {
        whereParamsPrefixed[`${table}.${k}`] = k === 'wallet' ? w.toLowerCase() : w;
    });

    const params = formatDBParamsToStr(whereParamsPrefixed, ' AND ');
    const query = `
        SELECT ${table}.*, d.to_chain, d.to_token_symbol, d.to_token_address
        FROM ${table}
        LEFT JOIN user_donation_setting d
        ON ${table}.id = d.user_id
        WHERE ${table}.status = 'active' AND ${params}`;
    let result = await db.executeQueryForResults(query);

    // return if no user found
    if (!result || result.length == 0) {
        return [] as User[];
    }

    // user's social media table
    const userIds = _.map(result, (r) => r.id);
    const socialQuery = `SELECT user_id, type, url FROM user_social_media WHERE user_id IN (${_.join(userIds, ', ')})`;

    // set social media into user's property
    const socialResult =  await db.executeQueryForResults(socialQuery);
    _.map(result, (r, k) => {
        const socialMedia: {[key: string]: any}  = {};
        const curr = _.filter(socialResult, {user_id: r.id})
        _.map(curr, (s) => {
            socialMedia[s.type] = s.url
        });

        // set profile pic url
        result![k].profile_picture = result![k].profile_picture ? getAssetUrl(result![k].profile_picture) : null;
        result![k].social = socialMedia;
        result![k] = _.omit(result![k], ['signature']);
    });

    return result as User[] ?? [];
}

// list (all)
export const list = async(): Promise<User[]> => {
    const db = new DB();

    // user table & user donation table
    const query = `
        SELECT ${table}.*, d.to_chain, d.to_token_symbol, d.to_token_address
        FROM ${table}
        LEFT JOIN user_donation_setting d
        ON ${table}.id = d.user_id
        WHERE status = 'active'`;
    let result = await db.executeQueryForResults(query);

    // return if no user found
    if (!result || result.length == 0) {
        return [] as User[];
    }

    // user's social media table
    const userIds = _.map(result, (r) => r.id);
    const socialQuery = `SELECT user_id, type, url FROM user_social_media WHERE user_id IN (${_.join(userIds, ', ')})`;
    const socialResult =  await db.executeQueryForResults(socialQuery);
    _.map(result, (r, k) => {
        const socialMedia: {[key: string]: any}  = {};
        const curr = _.filter(socialResult, {user_id: r.id})
        _.map(curr, (s) => {
            socialMedia[s.type] = s.url
        });

        result![k].profile_picture = result![k].profile_picture ? getAssetUrl(result![k].profile_picture) : null;
        result![k].social = socialMedia;
    });

    return result as User[] ?? [];
}

// update
export const update = async(id: number, updateParams: {[key: string]: any}): Promise<void> => {
    const db = new DB();

    let users = await find({ id, signature: updateParams.signature });
    if(users.length === 0) {
        throw Error("Unauthorized");
    }

    // user table
    const userFillableColumns = ['name' /* ,'signature' */, 'display_name', 'profile_picture'];
    const userParams = formatDBParamsToStr(_.pick(updateParams, userFillableColumns), ', ');
    const userQuery = `UPDATE ${table} SET ${userParams} WHERE id = ${id} AND status = 'active'`;

    // only execute when value is not empty
    if (userParams) {
        await db.executeQueryForSingleResult(userQuery);
    }

    // user's social media table
    const socialFillableColumns = ['twitch', 'discord', 'youtube', 'instagram', 'tiktok', 'twitter', 'facebook', 'email'];
    const socialParams = _.pick(updateParams, socialFillableColumns);
    // upsert hack
    let socialQuery = '';
    _.map(socialParams, (url, socialMedia) => {
        socialQuery += getUpsertQuery('user_social_media', { type: socialMedia, url: url }, { user_id: id, type: socialMedia, url: url }, { user_id: id, type: socialMedia })
    });
    await db.executeQuery(socialQuery);

    // user's donation setting table
    const donationFillableColumns = ['to_chain', 'to_token_symbol', 'to_token_address'];
    const donationParams = _.pick(updateParams, donationFillableColumns);

    // upsert hack
    let donationUpdateValue: {[key: string]: any} = {};
    _.map(donationParams, (value, key) => {
        donationUpdateValue[key] = value;
    });
    let donationInsertValue: {[key: string]: any} = {...donationUpdateValue, user_id: id};
    let donationSearchValue: {[key: string]: any} = {user_id: id};

    const donationQuery = getUpsertQuery('user_donation_setting', donationUpdateValue, donationInsertValue, donationSearchValue);
    await db.executeQuery(donationQuery);

    await updateIO(id);
}

// update io
export const updateIO = async(id: number) => {
    const user = await view(id);

    io.to(`studio_${user.wallet}`).emit('update', { user: convertBigIntToString(user) });
}

// delete (soft delete?)
// export const delete = async(userId: number) => {
//     const query = `DELETE FROM users WHERE user_id = ${userId}`;

//     const db = new DB();
//     const result = await db.executeQueryForSingleResult(query);

//     return result;
// }
