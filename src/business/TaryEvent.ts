import { listen } from '@tauri-apps/api/event';
import { player } from './player';
import { debounce } from 'lodash';

export async function initTaryEvent() {
    let volume;
    await listen<string>('play', debounce((_event: any) => {
        player.playOrPause();
    }, 300))

    await listen<string>('prevTrack', debounce((_event: any) => {
        player.playPrevTrack();
    }, 300))

    await listen<string>('nextTrack', debounce((_event: any) => {
        player.playNextTrack();
    }, 300))
    
    await listen<string>('increaseVolume', debounce((_event: any) => {
        volume = player.volume;  
        volume = volume + 0.1 > 1 ? 1 : volume + 0.1;
        player.volume = volume;
    }, 300))

    await listen<string>('decreaseVolume', debounce((_event: any) => {   
        volume = player.volume;  
        volume = volume - 0.1 > 0 ? volume - 0.1 : 0;
        player.volume = volume;
    }, 300))
}

