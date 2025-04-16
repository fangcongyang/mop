// @ts-nocheck
import fetch from 'node-fetch';
import { getOctokit, context } from '@actions/github';
 
const UPDATE_TAG_NAME = 'updater';
const UPDATE_FILE_NAME = 'update.json';
 
const getSignature = async (url) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/octet-stream' }
  });
  return response.text();
};
 
const octokit = getOctokit(process.env.github_token);
const options = { owner: context.repo.owner, repo: context.repo.repo };
 
const { data: release } = await octokit.rest.repos.getLatestRelease(options);
const darwin_aarch64 = `https://github.com/fangcongyang/mop/releases/download/${version}/mop_${version}_aarch64.app.tar.gz`;
const darwin_aarch64_sig = await getSignature(`https://github.com/fangcongyang/mop/releases/download/${version}/mop_${version}_aarch64.app.tar.gz.sig`);
const darwin_x86_64 = `https://github.com/fangcongyang/mop/releases/download/${version}/mop_${version}_x64.app.tar.gz`;
const darwin_x86_64_sig = await getSignature(`https://github.com/fangcongyang/mop/releases/download/${version}/mop_${version}_x64.app.tar.gz.sig`);
const windows_x86_64 = `https://github.com/fangcongyang/mop/releases/download/${version}/mop_${version}_x64-setup.nsis.zip`;
const windows_x86_64_sig = await getSignature(`https://github.com/fangcongyang/mop/releases/download/${version}/mop_${version}_x64-setup.nsis.zip.sig`);
const windows_i686 = `https://github.com/fangcongyang/mop/releases/download/${version}/mop_${version}_x86-setup.nsis.zip`;
const windows_i686_sig = await getSignature(`https://github.com/fangcongyang/mop/releases/download/${version}/mop_${version}_x86-setup.nsis.zip.sig`);
const windows_aarch64 = `https://github.com/fangcongyang/mop/releases/download/${version}/mop_${version}_arm64-setup.nsis.zip`;
const windows_aarch64_sig = await getSignature(`https://github.com/fangcongyang/mop/releases/download/${version}/mop_${version}_arm64-setup.nsis.zip.sig`);
const linux_x86_64 = `https://github.com/fangcongyang/mop/releases/download/${version}/mop_${version}_amd64.AppImage.tar.gz`;
const linux_x86_64_sig = await getSignature(`https://github.com/fangcongyang/mop/releases/download/${version}/mop_${version}_amd64.AppImage.tar.gz.sig`);

let updateData = {
    name: release.tag_name,
    notes: changelog,
    pub_date: new Date().toISOString(),
    platforms: {
        'darwin-aarch64': { signature: darwin_aarch64_sig, url: darwin_aarch64 },
        'darwin-x86_64': { signature: darwin_x86_64_sig, url: darwin_x86_64 },
        'windows-x86_64': { signature: windows_x86_64_sig, url: windows_x86_64 },
        'windows-i686': { signature: windows_i686_sig, url: windows_i686 },
        'windows-aarch64': { signature: windows_aarch64_sig, url: windows_aarch64 },
        'linux-x86_64': { signature: linux_x86_64_sig, url: linux_x86_64 },
        'linux-i686': { signature: darwin_aarch64_sig, url: darwin_aarch64 },
        'linux-aarch64': { signature: darwin_aarch64_sig, url: darwin_aarch64 },
        'linux-armv7': { signature: darwin_aarch64_sig, url: darwin_aarch64 },
    },
};
 
const { data: updater } = await octokit.rest.repos.getReleaseByTag({
  ...options,
  tag: UPDATE_TAG_NAME
});
 
for (const { id, name } of updater.assets) {
  if (name === UPDATE_FILE_NAME) {
    // eslint-disable-next-line no-await-in-loop
    await octokit.rest.repos.deleteReleaseAsset({ ...options, asset_id: id });
    break;
  }
}

async function getChangeLog(token) {
  const res = await fetch('https://api.github.com/repos/fangcongyang/mop/releases/latest', {
      method: 'GET',
      headers: {
          Authorization: `Bearer ${token}`,
      },
  });

  if (res.ok) {
      let data = await res.json();
      if (data['body']) {
          let changelog_md = data['body'];

          return changelog_md;
      }
  }
}

const TOKEN = process.env.GITHUB_TOKEN;

let changelog = await getChangeLog(TOKEN);
 
await octokit.rest.repos.uploadReleaseAsset({
  ...options,
  notes: changelog,
  release_id: updater.id,
  name: UPDATE_FILE_NAME,
  data: JSON.stringify(updateData)
});