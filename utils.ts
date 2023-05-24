import dotenv from 'dotenv';
import moment from 'moment';
import path from 'path';
dotenv.config({
    path: path.join(__dirname, '.env')
});
import axios, {AxiosRequestHeaders, AxiosRequestConfig, AxiosResponse} from "axios";
import crypto from "crypto";
import DB from './src/DB';
import _ from 'lodash';
import dayjs, { OpUnitType } from 'dayjs';

export function sleep(ms: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, ms);
    });
}

/**
 * Returns the number with 'en' locale settings, ie 1,000
 * @param x number
 * @param minDecimal number
 * @param maxDecimal number
 */
export function toLocaleDecimal(x: number, minDecimal: number, maxDecimal: number) {
    return x.toLocaleString('en', {
        minimumFractionDigits: minDecimal,
        maximumFractionDigits: maxDecimal
    });
}

/**
 * Runs the function if it's a function, returns the result or undefined
 * @param fn
 * @param args
 */
export const runIfFunction = (fn : any, ...args : any) : any | undefined => {
    if (typeof(fn) == 'function') {
        return fn(...args);
    }

    return undefined;
}

/**
 * Returns the ellipsized version of string
 * @param x string
 * @param leftCharLength number
 * @param rightCharLength number
 */
export function ellipsizeThis(x: string, leftCharLength: number, rightCharLength: number) {
    if (! x) {
        return x;
    }

    let totalLength = leftCharLength + rightCharLength;

    if (totalLength >= x.length) {
        return x;
    }

    return x.substring(0, leftCharLength) + "..." + x.substring(x.length - rightCharLength, x.length);
}

/**
 * Returns the new object that has no reference to the old object to avoid mutations.
 * @param obj
 */
export const cloneObj = <T = any>(obj : {
    [key : string]: any
}) => {
    return JSON.parse(JSON.stringify(obj))as T;
}

/**
 * @returns string
 */
export const getRandomColor = () => {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export const getRandomNumber = (min : number, max : number, isInteger = false) => {
    let rand = min + (Math.random() * (max - min));
    if (isInteger) {
        rand = Math.round(rand);
    } else { // to 3 decimals
        rand = Math.floor(rand * 1000) / 1000;
    }

    return rand;
}

export const getRandomChance = () => {
    return getRandomNumber(0, 100);
}

export const getRandomNumberAsString = (min : number, max : number, isInteger = false) => {
    return getRandomNumber(min, max, isInteger).toString();
}

export const getRandomChanceAsString = () => {
    return getRandomNumberAsString(0, 100);
}

export const getUTCMoment = () => {
    return moment().utc();
}

export const getUTCDatetime = () => {
    return getUTCMoment().format('YYYY-MM-DD HH:mm:ss');
}

export const getUTCDate = () => {
    return getUTCMoment().format('YYYY-MM-DD');
}

export const getDbConfig = () => {
    const DB_USER = process.env.DB_USER ?? "";
    const DB_PASSWORD = process.env.DB_PASSWORD ?? "";
    const DB_HOST = process.env.DB_HOST ?? "";
    const DB_PORT = process.env.DB_PORT ?? "5432";
    const DB_NAME = process.env.DB_NAME ?? "";

    return {
        user: DB_USER,
        password: DB_PASSWORD,
        host: DB_HOST,
        port: parseInt(DB_PORT),
        database: DB_NAME
    };
}

export const getInsertQuery = (columns : string[], values : any[][], table : string, returnId : boolean = false, schema : string = "public") => {
    let columnString = columns.join(",");
    let valueString = "";

    for (let value of values) {
        valueString += "(";
        for (let content of value) {
            if (typeof content === "string") {
                valueString += `'${content}'`;

            } else {
                valueString += `${content}`;
            } valueString += ",";
        }
        // remove last comma
        valueString = valueString.substring(0, valueString.length - 1);
        valueString += "),";
    }

    // remove last comma
    valueString = valueString.substring(0, valueString.length - 1);

    let query = `INSERT INTO ${schema}.${table} (${columnString}) VALUES ${valueString}`;
    if (returnId) {
        query += ' RETURNING id';
    }
    query += ';';
    return query;
}

export const getHash = (string : string) : string => {
    const hash = crypto.createHash('md5').update(string).digest("hex")
    return hash;
}

export const axiosCall = async (headers : AxiosRequestHeaders, config : AxiosRequestConfig) => {
    return new Promise((resolve, reject) => {
        axios(config).then((res) => {
            resolve(res.data);
        }).catch((err) => { // console.log(err);
            resolve(null);
        });
    });
}

/**
 * Generate crypto safe random number
 * @date 2022-10-01
 * @param { number } min
 * @param { number } max
 * @returns { number }
 */
export const getRandomIntInclusive = (min : number, max : number) : number => {
    const randomBuffer = new Uint32Array(1);
    crypto.webcrypto.getRandomValues(randomBuffer);

    let randomNumber = randomBuffer[0] / (0xffffffff + 1);

    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(randomNumber * (max - min + 1)) + min;
}

export const generateRandomNumberChar = (min : number, max : number) : string => {
    const charLength = getRandomIntInclusive(min, max)
    let numStr = '';

    for (let index = 0; index < charLength; index++) {
        numStr += index === 0 ? getRandomIntInclusive(1, 9).toString() : getRandomIntInclusive(0, 9).toString();
    }
    return numStr;
}

// check if the uuid is valid as sanitization
export const isValidUUID = (uuid : string) => {
    return(uuid.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i) ?. length ?? 0) > 0;
}

export const isCurrentUserAdmin = async (discord_id : string) => {
    let db = new DB();
    let query = `select count(*) as admin_count from admins where discord_id = '${discord_id}'`;
    let result = await db.executeQueryForSingleResult<{ admin_count: number }>(query);
    return result !== undefined && result.admin_count > 0;
}

/**
 * Use to construct postgres insert, where, select columns / values query
 * @date 2023-05-17
 * @param { {
    [key : string]: any
} } params
 * @param { * } parm2
 * @param { * } parm3
 */
export const formatDBParamsToStr = (params : {
    [key : string]: any
}, separator : string = ', ', valueOnly : boolean = false, prepend: string = "") => {
    let stringParams: string[] = [];
    _.map(params, (p, k) => {
        const value = typeof p === 'string' ? `'${p}'` : p;

        if (valueOnly) {
            stringParams.push(`${prepend? prepend + "." : ""}${value}`);
        } else {
            stringParams.push(`${prepend? prepend + "." : ""}${k} = ${value}`);
        }
    })

    return _.join(stringParams, separator);
}

/*
* Use to construct postgres where params with custom condition like 'LIKE', '>', '<', etc
* @date 2023-05-17
* @param {[key: string]: { cond: string, value: any }} params
*/
export const customDBWhereParams = (params : { field: string, cond: string, value: any }[]) => {
   const stringParams: string[] = [];
   _.map(params, (wp) => {
        const value = typeof wp.value === 'string' ? `'${wp.value}'` : wp.value;
        stringParams.push(`${wp.field} ${wp.cond} ${value}`)
   });

   return _.join(stringParams, ' AND ');
}


/**
 * Append hostname file path, construct url
 * @date 2023-05-17
 * @param { string } url
 */
export const getAssetUrl = (url : string) => {
    return `${
        process.env.DOMAIN
    }/assets/${url}`;
}

/**
 * Convert bigint inside obj into string (faciliate JSON.stringify)
 * @date 2023-05-17
 * @param { any } obj
 */
export const convertBigIntToString = (obj : any) => {
    if (typeof obj === 'object') {
        for (let key in obj) {
            if (typeof obj[key] === 'bigint') {
                obj[key] = obj[key].toString();
            } else if (typeof obj[key] === 'object') {
                obj[key] = convertBigIntToString(obj[key]);
            }
        }
    }

    return obj;
}

// https://stackoverflow.com/questions/1109061/insert-on-duplicate-update-in-postgresql
/**
 * Postgres upsert function
 * @date 2023-05-17
 * @param { string } table
 * @param { {[key: string]: any} } updateField
 * @param { {[key: string]: any} } insertField
 * @param { {[key: string]: any} } searchField
 * @returns { string }
 */
export const getUpsertQuery = (table: string, updateField: {[key: string]: any}, insertField: {[key: string]: any}, searchField: {[key: string]: any}): string => {
    // UPDATE table SET field='C', field2='Z' WHERE id=3;
    // INSERT INTO table (id, field, field2)
    //     SELECT 3, 'C', 'Z'
    //     WHERE NOT EXISTS (SELECT 1 FROM table WHERE id=3);

    const updateValue = formatDBParamsToStr(updateField, ', ');
    const searchValue = formatDBParamsToStr(searchField, ' AND ');
    const insertColumn = _.join(Object.keys(insertField), ', ');
    const insertValue = formatDBParamsToStr(insertField, ', ', true);

    const query = `
        UPDATE ${table} SET ${updateValue} WHERE ${searchValue};
        INSERT INTO ${table} (${insertColumn})
            SELECT ${insertValue}
            WHERE NOT EXISTS (SELECT 1 FROM ${table} WHERE ${searchValue});
    `;

    return query;
}

type mimeTypes = 'video' | 'image';
export const checkAllowedMime = (mime: string, checkTypes: mimeTypes[]): boolean => {
    const allowed = {
        'video': ['video/mp4', 'video/mpeg', 'video/quicktime'],
        'image': ['image/jpeg', 'image/jpg', 'image/gif', 'image/png', 'image/webp']
    }

    let valid = false;
    _.map(checkTypes, (type) => {
        if (!valid) {
            valid = allowed[type].includes(mime);
        }
    });

    return valid;
}

export const getPeriod = (period: 'monthly' | 'weekly' | 'daily') => {
    const dayParam = {
        'monthly': 'month',
        'weekly': 'week',
        'daily': 'day'
    }

    return { start: dayjs().startOf(dayParam[period] as OpUnitType).format('YYYY-MM-DD HH:mm:ss'), end: dayjs().endOf(dayParam[period] as OpUnitType).format('YYYY-MM-DD HH:mm:ss') };
}

/**
 * Get server port from env
 * @date 2023-05-17
 * @param { string } url
 */
export const getServerPort = () => {
    return process.env.SERVER_PORT;
}