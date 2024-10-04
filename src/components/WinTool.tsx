import { useState, CSSProperties } from "react";
import { useAppSelector } from "@/store/hooks";
import {
  settingsStore
} from "@/store/coreSlice"
import SvgIcon from "./SvgIcon";
import { getCurrentWindow } from "@tauri-apps/api/window";
import styles from "./WinTool.module.scss";

const WinTool = () => {
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const settings = useAppSelector(settingsStore);

  const svgStyle: CSSProperties = {
    width: "8Px",
    height: "14Px"
  };

  async function handleAlwaysTop() {
    setIsAlwaysOnTop(!isAlwaysOnTop);
    await getCurrentWindow().setAlwaysOnTop(!isAlwaysOnTop);
  }

  // 最小化
  const handleWinMin = async () => {
    await getCurrentWindow().minimize();
  };

  // 最小化
  const handleWinMax2Min = async () => {
    const resizable = await getCurrentWindow().isResizable();
    if (!resizable) return;
    await getCurrentWindow().setFullscreen(!fullscreen);
    setFullscreen(!fullscreen);
  };

  // 关闭
  const handleWinClose = async () => {
    await getCurrentWindow().close()
  };

  return (
      <div className={styles.frame} data-tauri-drag-region>
        <span className={styles.title}>
          {settings.title}
        </span>
        <div data-tauri-drag-region>
          <span
            className={styles.top}
            onClick={handleAlwaysTop}
          >
            <SvgIcon
              svgName="wintool-ontop"
              svgTitle="data.isAlwaysOnTop ? '取消置顶' : '置顶'"
              svgStyle={svgStyle}
              color={isAlwaysOnTop ? '#555555' : '#ffffff'}
            ></SvgIcon>
          </span>
          <span
            className={styles.min} onClick={handleWinMin}>
            <SvgIcon
              svgName="wintool-min"
              svgTitle="最小化"
              svgStyle={svgStyle}
              color="#ffffff"
            ></SvgIcon>
          </span>
          <span
            className={styles.max}
            onClick={handleWinMax2Min}
          >
            <SvgIcon
              svgName="wintool-max"
              svgTitle="data.isMaximized ? '还原' : '最大化'"
              svgStyle={svgStyle}
              color="#ffffff"
            ></SvgIcon>
          </span>
          <span v-if="closable"
            className={styles.close} onClick={handleWinClose}>
            <SvgIcon
              svgTitle="关闭"
              svgName="wintool-close"
              svgStyle={svgStyle}
              color="#ffffff"
            ></SvgIcon>
          </span >
        </div>
      </div >
  );
}

export default WinTool;
