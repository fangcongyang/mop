import { ReactElement, RefObject } from "react";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";

interface ScrollTopProps {
    children?: ReactElement | string;
    parentRef: RefObject<HTMLDivElement>;
}

const ScrollTop = (props: ScrollTopProps) => {
    const { children, parentRef } = props;

    const trigger = useScrollTrigger({
        target: parentRef.current!,
        disableHysteresis: true,
        threshold: 100,
    });

    const handleClick = () => {
        parentRef.current!.scrollTo({
            behavior: "smooth",
            top: 0,
        });
    };

    return (
        <Fade in={trigger}>
            <Box
                onClick={() => handleClick()}
                role="presentation"
                sx={{ position: "fixed", bottom: 76, right: 16 }}
            >
                {children}
            </Box>
        </Fade>
    );
};

export default ScrollTop;
