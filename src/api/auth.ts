import { invoke } from "@tauri-apps/api/core";

/**
 * 手机登录
 * - phone: 手机号码
 * - password: 密码
 * - countrycode: 国家码，用于国外手机号登录，例如美国传入：1
 * - md5_password: md5加密后的密码,传入后 password 将失效
 * @param {Object} params
 * @param {string} params.phone
 * @param {string} params.password
 * @param {string=} params.countrycode
 * @param {string=} params.md5_password
 */
export function loginWithPhone(params: any) {
    return new Promise((resolve, reject) => {
        invoke('login_cellphone', { data: params })
        .then((data: any) => {
            data = data.code === 200 ? data.data : {}
            resolve(data)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

/**
 * 邮箱登录
 * - email: 163 网易邮箱
 * - password: 密码
 * - md5_password: md5加密后的密码,传入后 password 将失效
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string=} params.md5_password
 */
export function loginWithEmail(params: any) {
    params.username = params.email;
    return new Promise((resolve, reject) => {
        invoke('login', { data: params })
        .then((data: any) => {
            data = data.code === 200 ? data.data : {}
            resolve(data)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

export function loginQrCodeKey() {
    return new Promise((resolve, reject) => {
        invoke('login_qr_codekey', { data: {} })
        .then((data: any) => {
            data = data.code === 200 ? data.data : {}
            resolve(data)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

/**
 * 二维码检测扫码状态接口
 * 说明: 轮询此接口可获取二维码扫码状态,800为二维码过期,801为等待扫码,802为待确认,803为授权登录成功(803状态码下会返回cookies)
 * @param {string} key
 */
export function loginQrCodeCheck(key: string) {
    return new Promise((resolve, reject) => {
        invoke('login_qr_check', { data: { key } })
        .then((data: any) => {
            data = data.code === 200 ? data.data : {}
            resolve(data)
        })
        .catch((e) => {
            reject(e)
        })
    })
}