# Maidata Notebook

一个面向舞萌自制谱师的静态配置索引：把值得复用的 maidata 短片段写进
`notes.js`，网页按标签和 BPM 检索，点击条目的“载入”后交给右侧
MajdataView WebGL Viewer 预览。

## 本地查看

直接用任意静态文件服务器打开本目录即可，例如：

```powershell
python -m http.server 4173
```

然后访问 `http://localhost:4173/`。页面不依赖 npm、框架或构建工具。

没有编译好的 Unity WebGL 产物时，右侧会显示 `VIEWER BUILD NOT FOUND`。
Viewer 的 Unity 源码在 `work/MajdataView_web`，它使用 GitHub Actions +
GameCI 构建，博客通过 `notes.js` 中的 `viewerUrl` 指向独立部署的 Viewer。

## 添加条目

复制 `notes.js` 中的对象并修改：

```js
{
  id: "my-config",
  title: "配置名称",
  description: "这段配置值得留下来的原因。",
  tags: ["TouchHold", "非 C 区"],
  bpm: 120,
  addedAt: "2026-08-31",
  maidata: "(120){4}A1[4:2]h,C,1,3,",
  source: { platform: "majnet", label: "Majnet", url: "https://majdata.net/" }
}
```

`bpm` 是用于闭区间查找的元数据；`maidata` 可以只放短谱面片段，Viewer
会自动补独立的 `E` 结束标记。`source.platform` 目前使用 `majnet` 或
`bilibili`，网页会显示对应图标。

## 发布

博客仓库可直接用 GitHub Pages 部署。Viewer 是另一个仓库：保留 GPL-3.0
源码和修改说明，配置 GitHub Actions 所需的 `UNITY_LICENSE`、
`UNITY_EMAIL`、`UNITY_PASSWORD` secrets，然后手动或 push 触发
`.github/workflows/build-webgl.yml`。构建完成后，把 Viewer Pages 地址写回
博客仓库的 `notes.js`：

```js
window.MAIDATA_CONFIG = { viewerUrl: "https://<account>.github.io/<viewer-repo>/" };
```

当前站点不包含登录和后端写入；“只有我能管理”由仓库写权限和提交流程保证。
