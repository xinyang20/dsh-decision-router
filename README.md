# DSH Decision Router

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 提供自动选模：由一个独立的决策模型理解任务，再从你配置的执行模型中选择路由和推理强度。

支持本地 Laya、d1-3B、d1-omni-600M，以及用户明确同意后启用的 System One 云端 API。决策模型负责选模型，执行模型负责完成任务。本项目是社区插件，采用 MIT 许可证。

## 特色

- **每轮决策，手动优先**：仅在 DSH 原生模型选择器中选中“自动”时参与路由。每轮用户交互决策一次，同轮工具调用沿用结果；选中具体模型后，下一次模型请求直接使用该模型及推理强度。
- **2–6 条自定义路由**：分别配置供应商、模型、推理档位、用途描述和补充说明。路由可以按能力划分，也可以分别擅长前端、后端、翻译等任务；编号和列表顺序不代表强弱。
- **原生设置体验**：“设置 → 自动选模”统一编辑配置，选择器沿用 DSH 菜单风格。侧边栏默认开启，提供只读总览和最近路由记录，也可在设置中关闭。
- **明确回退**：决策超时、服务失败或置信度不足时使用你指定的回退路由。本地失败不会自行转向云端，云端失败也不会换用其他决策服务。

已验证宿主版本为 **DSH `0.2.0-rc.2`**。DSH 仍在快速迭代，其他版本需要单独验证。

## 安装

准备已能运行的 DSH。插件安装需要 Node.js `^22.19.0 || >=24.0.0` 和 pnpm；在 DSH 中先配置可用的执行模型及其凭据。

从 GitHub 安装 `v0.1.0`：

```sh
dsh plugin --profile web add github:xinyang20/dsh-decision-router#v0.1.0
```

仓库包含预构建的 `lib/client.js`，插件安装无需执行 `prepare`。`#v0.1.0` 指定发布标签；需要固定到具体提交时可将标签替换为提交 ID。Git 安装由 DSH 调用 pnpm 完成，参见 [DSH 安装教程](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)及 [pnpm Git 来源说明](https://pnpm.io/package-sources#git-repository)。

也可从 [Releases](https://github.com/xinyang20/dsh-decision-router/releases) 下载预构建安装包，在下载目录执行：

```sh
dsh plugin --profile web add ./dsh-decision-router-0.1.0.tgz
```

安装后打开 DSH Web；若当前页面未出现插件入口，重启 DSH 并刷新页面。插件安装本身不会下载决策模型或启动本地推理服务。

## 首次配置

1. 打开“设置 → 自动选模”。初装处于“暂停决策”，执行路由尚未配置。
2. 配置 2–6 条路由，为每条选择已在 DSH 中配置的供应商、执行模型及其支持的推理强度，并填写用途描述。选择一个回退路由。
3. 选择决策方式：本地模型需先完成下文的准备并保持服务运行；云端 API 需确认数据传输并填写接口、模型和密钥。
4. 点击“保存模型配置”，将“路由模式”切换为“自动选择”。
5. 在对话的原生模型选择器中选择“自动选模 → 自动”，然后发送任务。

路由模式和侧边栏开关立即保存；模型、用途描述及回退路由等修改需要点击“保存模型配置”。关闭有未保存修改的设置页时，可以继续编辑、放弃修改或保存后关闭。

| 路由模式 | 选中“自动”后的行为 |
| --- | --- |
| 自动选择 | 请求决策模型，按结果执行；失败或置信度不足时使用回退路由 |
| 仅观察 | 请求并记录决策建议，实际始终使用回退路由 |
| 暂停决策 | 不请求决策模型，使用回退路由 |

**选择具体执行模型时，上述路由模式均不会覆盖手动选择。** 修改配置从下一轮决策生效，当前轮次继续沿用已有决定；主动切换具体模型则从下一次模型请求生效，包括同轮的后续工具步骤。

侧边栏“自动选模”只展示状态、配置摘要和最近路由记录。编辑请进入设置，发送任务请使用原生对话。

## 使用本地决策

本地辅助服务当前支持 **macOS**；其中 d1 安装脚本仅支持 **Apple Silicon（arm64）**。模型子进程依靠 macOS `sandbox-exec` 禁止主动联网，启动时验证隔离，验证失败会拒绝启动。其他系统尚未支持这套隔离运行方式。

在本机单独克隆同版本仓库，用于准备和启动服务。准备 Node.js、pnpm；使用 Laya 时还需要 [uv](https://docs.astral.sh/uv/)。

```sh
git clone --branch v0.1.0 --depth 1 https://github.com/xinyang20/dsh-decision-router.git
cd dsh-decision-router
pnpm install --frozen-lockfile
```

按需要准备模型，两种方式可以任选其一或都安装：

| 模型 | 准备命令 | 当前实现 |
| --- | --- | --- |
| Laya 多语言 | `pnpm run laya:setup`，再运行 `pnpm run laya:download` | 固定 Laya `0.3.28`，通过 uv 创建项目内 Python 3.12 环境，使用本地多语言权重和 CPU 推理 |
| d1-3B / d1-omni-600M | `pnpm run d1:setup` | 下载固定版本 llama.cpp `b11490` 及两款 GGUF；仅 macOS arm64 |

d1-3B 使用 Q4_K_M 文本权重，约 1.67 GB；d1-omni-600M 使用 Q8_0 文本权重，约 407 MB，作为实验选项提供。本项目没有下载图片或音频 projector，三款模型当前都只处理文本路由。

依赖安装和首次准备模型需要联网，下载软件及模型，不携带任务内容。文件保存在项目内的 `.venv`、`.runtime` 和 `.cache`；再次准备时复用已有文件。日常推理使用本地文件，不会自动下载缺失模型。

准备完成后，在该仓库目录启动统一服务，并保持此终端运行：

```sh
pnpm run decision:serve
```

服务监听 `127.0.0.1:39401`。看到 `ready: true` 后，在 DSH 设置中选择已安装的决策模型。服务每次只保留一个模型进程，切换模型时释放旧模型并按需加载新模型；首次请求可能包含加载时间。按 `Ctrl+C` 停止服务及其模型进程。

本地服务使用回环 HTTP，不跟随重定向或使用环境代理；模型子进程不继承 API Key 和代理变量。隔离范围是**本地决策过程**，执行模型是否联网由你在 DSH 中选择的供应商决定。

## 使用云端决策

云端模式不需要下载本地模型，也不需要启动 `decision:serve`。在设置中选择“System One API（云端）”，默认接口为 `https://api.typesafe.ai/v1/systemone`，默认模型为 `jev-latest`；也可使用兼容该协议的 HTTPS 接口。

选择时会显示红色数据传输提示，提供“放弃”和“我已了解”。任务组成的 `state`、最多两条近期用户输入，以及候选路由的用途描述和补充说明会发送到所选服务。确认后填写密钥并保存模型配置，才会用于决策。修改接口或模型后需要重新确认，更换接口还需要重新填写密钥。

仅在原生模型选中“自动”且模式为“自动选择”或“仅观察”时发送云端决策请求。**“仅观察”仍会发送数据。** “暂停决策”、选择具体执行模型或切换回本地决策后，不会继续请求云端决策。

云端密钥保存在本机配置文件，权限为 `0600`，未加密；设置读取和保存响应不会回显密钥。同一接口重新编辑时，密钥留空表示保留已保存的值。执行模型的凭据仍由 DSH 管理。

目前已通过本地测试覆盖协议处理、确认范围、密钥隐藏、取消和失败回退；**尚未使用真实密钥验证 Jev API 调用**。云端可用性、费用和任务路由效果需要用户配置后自行验证。协议依据：[System One API 官方文档](https://docs.typesafe.ai/api)。

## 数据与配置

配置默认保存在 DSH 数据目录下的 `plugins/dsh-decision-router/model-tiers.json`，即 `$DSH_HOME/plugins/dsh-decision-router/model-tiers.json`。包括路由、决策方式、回退选择、路由模式、侧边栏开关及可选云端凭据，重启后保留。高级部署可以通过插件的 `modelsFile` 配置指定其他绝对路径。

路由记录保存在宿主进程内，跨对话合计最多 200 条，重启后清空。记录包含决策建议、回退原因、应用的模型及耗时。置信度表示候选概率分布的集中程度，没有经过任务成功率校准；高置信度不等于一定选对模型。

## 开发与验证

仓库自带固定版本的 DSH 开发依赖，不依赖旁边的其他项目。安装依赖后运行：

```sh
pnpm run test
pnpm run build
```

测试覆盖真实 DSH 生命周期中的自动入口、手动优先、每轮保持、配置保存与失败回退，执行模型使用确定性测试替身；云端协议使用本地替身，不调用真实外部 API。已有三款本地决策模型的真实推理与 DSH 工具循环验证，这些结果不代表执行模型实际任务效果，也不构成准确率、性能或费用节省的基准。

开发预览可运行 `pnpm run preview`；它使用独立的项目内 DSH 数据目录和本地执行替身，需要先准备本地决策模型。首次在浏览器打开时，使用启动输出给出的完整登录链接。预览中的执行回复用于验证路由，不能完成真实生成任务。

问题和建议请提交至 [Issues](https://github.com/xinyang20/dsh-decision-router/issues)。

## 许可证

插件自身代码采用 [MIT](LICENSE)。安装脚本下载的模型与运行时保留各自许可证，不因本项目采用 MIT 而变更：

- Laya 软件和多语言模型：Apache-2.0，见 [Laya LICENSE](https://github.com/NandhaKishorM/laya/blob/main/LICENSE) 和 [模型卡](https://huggingface.co/convaiinnovations/laya-multilingual)。
- d1-3B、d1-omni-600M 权重：LFM Open License v1.0，见 [d1-3B GGUF 许可证](https://huggingface.co/LiquidAI/d1-3B-GGUF/blob/bb1e436ea78eb96a3f1acb6da865f70c2fbeb563/LICENSE) 和 [d1-omni-600M GGUF 许可证](https://huggingface.co/LiquidAI/d1-omni-600M-GGUF/blob/04397145ed8381350403aa556db0ec6a49dd8c07/LICENSE)。使用和再分发须遵守其完整条款。
- llama.cpp：MIT，见 [上游许可证](https://github.com/ggml-org/llama.cpp/blob/b11490/LICENSE)。

模型权重与下载的 llama.cpp 二进制不包含在本仓库或插件安装包中。
