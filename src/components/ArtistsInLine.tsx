import { FunctionComponent, useMemo } from "react";
import { Link } from "react-router-dom";

interface ArtistsInLineProps {
    artists: [],
    exclude?: string,
    prefix?: string
}

const ArtistsInLine: FunctionComponent<ArtistsInLineProps> = (props) => {

    const filteredArtists = useMemo(() => {
        return props.artists.filter((a: any) => a.name !== props.exclude);
    }, [props.artists, props.exclude])

    const computedPrefix = useMemo(() => {
        if (filteredArtists.length !== 0) return props.prefix;
        else return '';
    }, [filteredArtists, props.prefix])

    return (
        <span className="artist-in-line">
            {computedPrefix}
            {
                filteredArtists.map((ar: any, index) => {
                    return (
                        <span key={index}>
                            {
                                ar.id !== 0 ?
                                    <Link to={`/artist/${ar.id}`}>{
                                        ar.name
                                    }</Link>
                                    :
                                    <span>{ar.name}</span>
                            }
                            {
                                index + 1 !== filteredArtists.length ?
                                <span className="separator">
                                    ,
                                </span>
                                : ''
                            }
                        </span >
                    )
                })
            }
        </span >
    )
}

export default ArtistsInLine;