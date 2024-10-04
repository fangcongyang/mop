import dayjs from 'dayjs';
import i18next from 'i18next';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';

export function resizeImage(imgUrl: string, size = 512) {
  if (!imgUrl) return '';
  let httpsImgUrl = imgUrl;
  if (imgUrl.slice(0, 5) !== 'https') {
    httpsImgUrl = 'https' + imgUrl.slice(4);
  }
  return `${httpsImgUrl}?param=${size}y${size}`;
}

export function formatPlayCount(count: number) {
  if (!count) return '';
  if (count > 100000000) {
    return `${Math.floor((count / 100000000) * 100) / 100}亿`; // 2.32 亿
  }
  if (count > 100000) {
    return `${Math.floor((count / 10000) * 10) / 10}万`; // 232.1 万
  }
  if (count > 10000) {
    return `${Math.floor((count / 10000) * 100) / 100}万`; // 2.3 万
  }
  return count;
}

export function formatDate(timestamp: number, format = 'MMM D, YYYY') {
  if (!timestamp) return '';
  if (i18next.language === 'zh_cn') format = 'YYYY年MM月DD日';
  else if (i18next.language === 'zh-TW') format = 'YYYY年MM月DD日';
  return dayjs(timestamp).format(format);
}

export function formatTime(milliseconds: number, format = 'HH:MM:SS') {
  if (!milliseconds) return '';
  dayjs.extend(duration);
  dayjs.extend(relativeTime);

  let time = dayjs.duration(milliseconds);
  let hours = time.hours().toString();
  let mins = time.minutes().toString();
  let seconds = time.seconds().toString().padStart(2, '0');

  if (format === 'HH:MM:SS') {
    return hours !== '0'
      ? `${hours}:${mins.padStart(2, '0')}:${seconds}`
      : `${mins}:${seconds}`;
  } else if (format === 'Human') {
    let hoursUnit, minitesUnit;
    switch (i18next.language) {
      case 'zh_cn':
        hoursUnit = '小时';
        minitesUnit = '分钟';
        break;
      case 'zh_tw':
        hoursUnit = '小時';
        minitesUnit = '分鐘';
        break;
      default:
        hoursUnit = 'hr';
        minitesUnit = 'min';
        break;
    }
    return hours !== '0'
      ? `${hours} ${hoursUnit} ${mins} ${minitesUnit}`
      : `${mins} ${minitesUnit}`;
  }
}

export function formatTrackTime(value: number) {
  if (!value) return '0:00';
  let min = ~~(value / 60);
  let sec = (~~(value % 60)).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

export function formatAlbumType(type: string, album: any) {
  if (!type) return '';
  if (type === 'EP/Single') {
    return album.size === 1 ? 'Single' : 'EP';
  } else if (type === 'Single') {
    return 'Single';
  } else if (type === '专辑') {
    return 'Album';
  } else {
    return type;
  }
}