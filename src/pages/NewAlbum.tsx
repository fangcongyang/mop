import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CoverRow from "@/components/CoverRow";
import { newAlbums } from "@/api/album";
import _ from "lodash";
import "./NewAlbum.scss";

const NewAlbum = () => {
    const { t } = useTranslation();
    const [albums, setAlbums] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [])

    const loadData = _.debounce(() => {
        newAlbums({
            area: 'EA',
            limit: 100,
        }).then((data: any) => {
            setAlbums(data.albums);
        });
    }, 500)

    return (
        <div className="newAlbum">
            <h1>{t('home.newAlbum')}</h1>
            <div className="playlist-row">
                <div className="playlists">
                    <CoverRow
                        type="album"
                        items={albums}
                        subText="artist"
                    />
                </div>
            </div>
        </div>
    )
}

export default NewAlbum;