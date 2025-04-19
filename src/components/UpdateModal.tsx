import React, { useState, useEffect } from "react";
import Modal from "./Modal"; // Assuming Modal component exists
import ButtonTwoTone from "./ButtonTwoTone"; // Assuming ButtonTwoTone component exists
import { useTranslation } from "react-i18next";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import styles from "./UpdateModal.module.scss";
import { invoke } from "@tauri-apps/api/core";
import { GithubLatestReleaseInfo } from "@/type/github";
import { marked } from "marked";
import { Box, LinearProgress, Typography } from "@mui/material";

interface UpdateModalProps {
  show: boolean;
  currentVersion: string;
  onClose: () => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({
  show,
  currentVersion,
  onClose,
}) => {
  const { t } = useTranslation();
  const [latestVersion, setLatestVersion] = useState("");
  const [body, setBody] = useState<String | Promise<string>>("");
  const [isStarted, setIsStarted] = useState(false); // Add isStarted
  const [progress, setProgress] = useState(0); // Add progres

  useEffect(() => {
    invoke<GithubLatestReleaseInfo>("github_repos_info_version", {
      owner: "fangcongyang",
      repo: "mop",
    }).then((githubLatestReleaseInfo: GithubLatestReleaseInfo) => {
      setLatestVersion(githubLatestReleaseInfo.tag_name);
      setBody(marked.parse(githubLatestReleaseInfo.body));
    });
  }, []);

  if (!show) {
    return null;
  }

  const doUpdate = async () => {
    const update = await check();
    if (update) {
      let downloaded = 0;
      let contentLength = 0;
      // alternatively we could also call update.download() and update.install() separately
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength as number;
            setIsStarted(true);
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            setProgress(
              parseFloat(((downloaded / contentLength) * 100).toFixed(2))
            );
            break;
          case "Finished":
            setIsStarted(false);
            break;
        }
      });

      await relaunch();
    }
  };

  return (
    <Modal
      title="检查更新"
      showFooter={false}
      show={show}
      close={onClose}
      clickOutsideHide={false}
      className={styles.updateModal}
    >
      <h2>
        {t("update.newVersion")}:{latestVersion}
      </h2>
      <div className={styles.changelog}>
        <h3>{t("update.changelog")}</h3>
        <div dangerouslySetInnerHTML={{ __html: body as string }} />
      </div>
      <div>
        {isStarted && (
          <>
            <Box sx={{ width: "100%", mr: 1 }}>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
            <Box sx={{ minWidth: 120 }}>
              <Typography variant="body2" color="text.secondary">
                {`${Math.round(progress)}%`}
              </Typography>
            </Box>
          </>
        )}
      </div>
      <div className={styles.actions}>
        {latestVersion !== currentVersion && (
          <ButtonTwoTone onClick={doUpdate} color="primary">
            {t("update.updateNow")}
          </ButtonTwoTone>
        )}
        <ButtonTwoTone onClick={onClose} color="secondary">
          {t("update.remindLater")}
        </ButtonTwoTone>
      </div>
    </Modal>
  );
};

export default UpdateModal;
