import { invoke } from "@tauri-apps/api/core"

export function do_invoke(url: string, params: any) {
    return new Promise((resolve, reject) => {
        invoke(url, params)
       .then((data: any) => {
          data = data.code === 200 ? data.data : null
          resolve(data)
       })
       .catch((e) => {
        reject(e)
       })
    }) 
}