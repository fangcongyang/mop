import { MouseEvent } from "react";
import * as Vibrant from "node-vibrant/dist/vibrant.worker.min.js";
import Color from "color";

export function clickStop(event: MouseEvent) {
    event.preventDefault();
    // 阻止合成事件的冒泡
    event.stopPropagation();
}

export function randomNum(minNum: number, maxNum: number) {
    switch (arguments.length) {
        case 1:
            return Math.round(Math.random() * minNum) + 1;
        case 2:
            return Math.round(Math.random() * (maxNum - minNum + 1)) + minNum;
        default:
            return 0;
    }
}

/**
 * 提取背景颜色
 */
export function backgroundColor(
    cover: String,
    callback: (arg0: string) => void
) {
    Vibrant.from(cover, { count: 1 })
        .getPalette()
        .then((palette: any) => {
            const originColor = Color.rgb(palette.DarkMuted!.rgb);
            const color = originColor.darken(0.1).rgb().string();
            const color2 = originColor.lighten(0.28).rotate(-30).rgb().string();
            callback(`linear-gradient(to top left, ${color}, ${color2})`);
        });
}

export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}