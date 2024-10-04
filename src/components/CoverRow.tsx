import { FC } from "react";
import { Link } from "react-router-dom";
import Cover from "./Cover";
import SvgIcon from "./SvgIcon";
import ExplicitSymbol from "./ExplicitSymbol";
import { formatPlayCount } from '@/utils/data';
import styles from './CoverRow.module.scss';

type CoverRowProps = {
    items: any
    type: string
    subText?: string
    subTextFontSize?: string
    showPlayCount?: boolean
    columnNumber?: number
    gap?: string
    playButtonSize?: number
};
const CoverRow: FC<CoverRowProps> = ({
    items = undefined,
    type = "",
    subText = 'null',
    subTextFontSize = '16px',
    showPlayCount = false,
    columnNumber = 5,
    gap = '44px 24px',
    playButtonSize = 22,
}) => {
    const rowStyles = () => {
        return {
            'gridTemplateColumns': `repeat(${columnNumber}, 1fr)`,
            gap: gap,
        };
    }

    const getImageUrl = (item: any) => {
        if (item.img1v1Url) {
            let img1v1ID = item.img1v1Url.split('/');
            img1v1ID = img1v1ID[img1v1ID.length - 1];
            if (img1v1ID === '5639395138885805.jpg') {
                // 没有头像的歌手，网易云返回的img1v1Url并不是正方形的 😅😅😅
                return 'https://p2.music.126.net/VnZiScyynLG7atLIZ2YPkw==/18686200114669622.jpg?param=512y512';
            }
        }
        let img = item.img1v1Url || item.picUrl || item.coverImgUrl;
        return `${img?.replace('http://', 'https://')}?param=512y512`;
    }

    const isExplicit = (item: any) => {
      return type === 'album' && item.mark === 1056768;
    }

    const isPrivacy = (item: any) => {
        return type === 'playlist' && item.privacy === 10;
    }

    const getSubText = (item: any) => {
        if (subText === 'creator') return 'by ' + item.creator.nickname;
        if (subText === 'releaseYear')
          return new Date(item.publishTime).getFullYear();
        if (subText === 'artist') {
          if (item.artist !== undefined)
            return `<a href="/artist/${item.artist.id}">${item.artist.name}</a>`;
          if (item.artists !== undefined)
            return `<a href="/artist/${item.artists[0].id}">${item.artists[0].name}</a>`;
        }
        if (subText === 'albumType+releaseYear') {
          let albumType = item.type;
          if (item.type === 'EP/Single') {
            albumType = item.size === 1 ? 'Single' : 'EP';
          } else if (item.type === 'Single') {
            albumType = 'Single';
          } else if (item.type === '专辑') {
            albumType = 'Album';
          }
          return `${albumType} · ${new Date(item.publishTime).getFullYear()}`;
        }
        if (subText === 'appleMusic') return 'by Apple Music';
        return item[subText];
    }

    return (
        <div className={styles.coverRow} style={rowStyles()}>
            {
                items.map((item: any) => {
                    return (
                        <div className={type === 'artist' ? styles.item + ' ' + styles.artist : styles.item} key={item.id}>
                            <Cover id={item.id} imageUrl={getImageUrl(item)} type={type}
                                playButtonSize={type === 'artist' ? 26 : playButtonSize!} />
                            <div className="text">
                                {
                                    showPlayCount ?
                                        <div className="info">
                                            <span className="play-count">
                                                <SvgIcon svgName="play" />
                                                {formatPlayCount(item.playCount)}
                                            </span>
                                        </div>
                                        : ''
                                }
                                <div className={styles.title} style={{ fontSize: subTextFontSize }}>
                                    {
                                        isExplicit(item) ?
                                            <span className="explicit-symbol">
                                                <ExplicitSymbol />
                                            </span>
                                            : ''
                                    }
                                    {
                                        isPrivacy(item) ?
                                            <span className="lock-icon">
                                                <SvgIcon svgName="lock" />
                                            </span>
                                            : ''
                                    }
                                    <Link to={`/${type}/${item.id}`}>{item.name}</Link>
                                </div>
                                {
                                    type !== 'artist' && subText !== 'none' ?
                                    <div className="info">
                                        <span dangerouslySetInnerHTML={{__html: getSubText(item)}}></span>
                                    </div>
                                    : ''
                                }
                            </div>
                        </div>
                    )
                })
            }
        </div>
    );
}

export default CoverRow;