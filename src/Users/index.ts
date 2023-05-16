import DB from "../DB"
import {
    formatDBParamsToStr,
    getAssetUrl,
    getInsertQuery,
    getUpsertQuery
} from '../../utils';
import _ from "lodash";
import { User } from "./types";

const table = 'users';

// create
export const create = async(insertParams: any): Promise<void> => {
    const fillableColumns = [ 'name', 'wallet', 'signature', 'profile_picture' ];
    const params = formatDBParamsToStr(_.pick(insertParams, fillableColumns), ', ', true);

    // put quote
    const insertColumns = Object.keys(insertParams);

    const query = `INSERT INTO ${table} (${_.join(insertColumns, ', ')}) VALUES (${params}) RETURNING id`;

    const db = new DB();
    await db.executeQueryForSingleResult(query);
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
    console.log(query);
    // return if no user found
    if (!result || result.length == 0) {
        return {} as User;
    }

    // user's social media table
    const socialQuery = `SELECT user_id, type, url FROM user_social_media WHERE user_id IN (${result.id})`;
    const socialResult =  await db.executeQueryForResults(socialQuery);

    const socialMedia: {[key: string]: any}  = {};
    const curr = _.filter(socialResult, {user_id: result.id})
    _.map(curr, (s) => {
        socialMedia[s.type] = s.url
    });

    result.profile_picture = result.profile_picture ? getAssetUrl(result.profile_picture) : null;
    result.social = socialMedia;

    return result;
}

// find (single - field)
export const find = async(whereParams: {[key: string]: any}): Promise<User[]> => {
    const db = new DB();

    // user table
    let whereParamsPrefixed: {[key: string]: any} = {};
    _.map(whereParams, (w, k) => {
        whereParamsPrefixed[`${table}.${k}`] = w;
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

    return result as User[];
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

    return result as User[];
}

// update
export const update = async(id: number, updateParams: {[key: string]: any}): Promise<void> => {
    const db = new DB();

    // user table
    const userFillableColumns = ['name', 'signature', 'profile_picture'];
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
}

// delete (soft delete?)
// export const delete = async(userId: number) => {
//     const query = `DELETE FROM users WHERE user_id = ${userId}`;

//     const db = new DB();
//     const result = await db.executeQueryForSingleResult(query);

//     return result;
// }
