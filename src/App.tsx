import { FunctionComponent, ReactElement, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Link, Routes, Route, Navigate } from "react-router-dom";
import {
    getAppConf,
    mainEnableScrollingStore,
    showLyricsStore,
} from "@/store/coreSlice";
import WinTool from "@/components/WinTool";
import Navbar from "@/components/Navbar";
import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import Library from "@/pages/Library";
import Player from "@/components/Player";
import Playlist from "./pages/Playlist";
import "./App.scss";
import Toast from "./components/Toast";
import Login from "./pages/Login";
import LoginAccount from "./pages/LoginAccount";
import Settings from "./pages/Settings";
import LastfmCallback from "./pages/LastfmCallback";
import Next from "./pages/Next";
import Lyrics from "./pages/Lyrics";
import { Transition } from "react-transition-group";
import auth from "./utils/auth";
import Album from "./pages/Album";
import Artist from "./pages/Artist";
import ArtistMv from "./pages/ArtistMv";
import DailyTracks from "./pages/DailyTracks";
import LoginUsername from "./pages/LoginUsername";
import Mv from "./pages/Mv";
import NewAlbum from "./pages/NewAlbum";
import Search from "./pages/Search";
import SearchType from "./pages/SearchType";
import ModalAddTrackToPlaylist from "./components/ModalAddTrackToPlaylist";
import ModalNewPlaylist from "./components/ModalNewPlaylist";

function App() {
    const dispatch = useAppDispatch();
    const showLyrics = useAppSelector(showLyricsStore);
    const mainEnableScrolling = useAppSelector(mainEnableScrollingStore);
    const main = useRef<HTMLDivElement>(null);
    const lyricsNodeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        dispatch(getAppConf());
    });

    return (
        <div className="main-body">
            <WinTool></WinTool>
            <main
                id="main"
                ref={main}
                style={{ overflow: mainEnableScrolling ? "auto" : "hidden" }}
            >
                <Routes>
                    <Route path="/" element={<Navbar />}>
                        <Route path="/album/:id" element={<Album />} />
                        <Route
                            path="/artist/:id"
                            element={<Artist parentRef={main} />}
                        />
                        <Route path="/artist/:id/mv" element={<ArtistMv />} />
                        <Route
                            path="/daily/songs"
                            element={
                                <RequireAuth>
                                    <DailyTracks parentRef={main} />
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/explore"
                            element={<Explore parentRef={main} />}
                        />
                        <Route index element={<Home />} />
                        <Route
                            path="/lastfm/callback"
                            element={<LastfmCallback />}
                        />
                        <Route
                            path="/library"
                            element={
                                <RequireAuth>
                                    <Library parentRef={main} />
                                </RequireAuth>
                            }
                        />
                        <Route path="/login" element={<Login />} />
                        <Route path="/account" element={<LoginAccount />} />
                        <Route
                            path="/login/username"
                            element={<LoginUsername />}
                        />
                        <Route path="/mv/:id" element={<Mv />} />
                        <Route path="/new-album" element={<NewAlbum />} />
                        <Route path="/next" element={<Next />} />
                        <Route path="/playlist/:id" element={<Playlist />} />
                        <Route path="/search/:keywords" element={<Search />} />
                        <Route
                            path="/search/:keywords/:type"
                            element={<SearchType />}
                        />
                        <Route path="/settings" element={<Settings />} />
                        <Route
                            path="/library/liked-songs"
                            element={<Playlist />}
                        />
                        <Route path="*" element={<NoMatch />} />
                    </Route>
                </Routes>
            </main>
            <Player></Player>
            <Toast />
            {auth.isAccountLoggedIn() && <ModalNewPlaylist />}
            {auth.isAccountLoggedIn() && <ModalAddTrackToPlaylist />}
            <Transition nodeRef={lyricsNodeRef} in={showLyrics} timeout={200}>
                {(state) =>
                    showLyrics ? (
                        <Lyrics
                            ref={lyricsNodeRef}
                            className={`slide-up slide-up-${state}`}
                        />
                    ) : (
                        ""
                    )
                }
            </Transition>
        </div>
    );
}

function NoMatch() {
    return (
        <div>
            <h2>Nothing to see here!</h2>
            <p>
                <Link to="/">Go to the home page</Link>
            </p>
        </div>
    );
}

interface RequireAuthProps {
    children: ReactElement;
}

const RequireAuth: FunctionComponent<RequireAuthProps> = ({ children }) => {
    return auth.isAccountLoggedIn() ? (
        children
    ) : (
        <Navigate to="/account" replace />
    );
};

export default App;
