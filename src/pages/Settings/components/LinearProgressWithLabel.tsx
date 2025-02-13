import { Box, LinearProgress, Typography, LinearProgressProps } from "@mui/material";

const LinearProgressWithLabel = (props: LinearProgressProps & { downloadspeed: number }) => (
    <Box sx={{ display: "flex", alignItems: "center" }}>
        <Box sx={{ width: "100%", mr: 1 }}>
            <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box sx={{ minWidth: 120 }}>
            <Typography variant="body2" color="text.secondary">
                {`${Math.round(props.value!)}% ${props.downloadspeed}MB/s`}
            </Typography>
        </Box>
    </Box>
);

export default LinearProgressWithLabel;