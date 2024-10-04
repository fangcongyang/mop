import { FC, useMemo } from "react";
import Slider from "@mui/material/Slider";
import ButtonIcon from "./ButtonIcon";
import SvgIcon from "./SvgIcon";
import "./VolumeControl.scss";

interface VolumeControlProps {
    size?: "small" | "medium";
    volume: number;
    mute: boolean;
    onMute?: () => void;
    onVolumeChange?: (value: number) => void;
}

const VolumeControl: FC<VolumeControlProps> = ({
    size = "small",
    volume,
    mute,
    onMute,
    onVolumeChange,
}) => {
    const volumeIcon = useMemo(() => {
        if (volume === 0 || mute) {
            return "volume-mute";
        } else if (volume > 0.5) {
            return "volume";
        } else {
            return "volume-half";
        }
    }, [volume, mute]);

    return (
        <div className="volume-control">
            <ButtonIcon
                title="静音"
                onClick={() => {
                    onMute?.();
                }}
            >
                <SvgIcon svgName={volumeIcon} />
            </ButtonIcon>
            <div className="volume-bar">
                <Slider
                    aria-label="time-indicator"
                    size={size}
                    value={volume}
                    min={0}
                    step={0.01}
                    max={1}
                    valueLabelDisplay="auto"
                    onChange={(_, value) => {
                        onVolumeChange?.(value as number);
                    }}
                    sx={{
                        color: "var(--color-text)",
                        height: size === "medium" ? "none" : "3px",
                        padding: "0 1px",
                        "& .MuiSlider-track": {
                            border: "none",
                        },
                        "& .MuiSlider-thumb": {
                            width: 0,
                            height: 0,
                            backgroundColor: "#fff",
                            "&:before": {
                                boxShadow: "0 1px 3px 0 #2D2D2D",
                            },
                            "&:hover, &.Mui-focusVisible, &.Mui-active": {
                                boxShadow: "none",
                            },
                        },
                        "& .MuiSlider-rail": {
                            color: "var(--color-text)",
                            opacity: 0.28,
                        },
                        "&:hover": {
                            color: "var(--color-volume-hover)",
                            "& .MuiSlider-thumb": {
                                width: 12,
                                height: 12,
                            },
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default VolumeControl;
