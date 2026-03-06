# 基于新版本 `proposal.md` 的改动建议（Detail + Reasoning）

## 1. 先说结论（你这版 proposal 的关键变化）
你更新后的版本，相比之前更清晰地强调了 5 件事：
1. 对外口径：面向 ICICLE 共享内容要简洁且结果导向。
2. 交付策略：先手工完成 6 个 HF/ICICLE 对象，再自动化。
3. 系统边界：`Privacy Layer` 明确“暂不在近期议程”。
4. 集成目标：明确要向 MLHub 暴露 FastAPI endpoints。
5. 数据增强：允许“Confidence Score + source-text citation + HITL 验证”。

这意味着：方案要从“技术理想型”收敛为“可按 6 个月节奏执行的分阶段路线图”，并把 schema/API 设计直接对齐上述五点。

---

## 2. 建议你在 `proposal.md` 里做的结构性改动

## 2.1 把任务改成“阶段化交付”而不是并列任务清单
建议在 `Implementation Tasks` 前增加一个“Phased Delivery Plan”。

建议阶段：
- Phase 0（立即-2周）：词汇冻结（node schema + edge vocabulary + ID策略）
- Phase 1（到 Aug 2026）：6 个对象手工建卡 + 原子 CRUD MVP + MLHub 基础查询
- Phase 2（Sep-Oct 2026）：自动化增强（Watcher/增量同步/字段增强置信度）
- Phase 3（后续）：Privacy Layer（JWT/RBAC）

Reasoning：
- 你这版已经明确“隐私层暂不做”，但当前文档里仍与近期任务并列，容易让实现团队误判优先级。
- 评审看 proposal 时，最关注“按时间落地什么”，不是“理论上可以做什么”。

## 2.2 把 Success Criteria 从口号改成可验证指标
你新增了 `User feedback-driven changes`，建议补成可验收指标：
- 覆盖率：ICICLE 环境模型/数据集建卡覆盖率 >= X%
- 新鲜度：HF/ICICLE 关键对象同步延迟 <= Y 小时（Phase 2）
- 完整度：核心字段（P0）完整率 >= Z%
- 可复现字段：`code_commit_sha/dataset_hash/environment/seed` 完整率
- 安全字段：`critical/high vulns` 有值率 + 未修复高危计数趋势
- 用户反馈闭环：从反馈到字段/接口改动的平均周期

Reasoning：
- “feedback-driven”需要量化，否则很难在汇报或论文里证明改进有效。

---

## 3. 对对象模型的具体改动建议（按你新文本逐条）

## 3.1 Model Card Object：建议从“治理中心”升级为“治理 + 可追溯入口”
你现在写法是合理的，但建议补这几类字段：
- 来源追踪：`source_system`, `source_uri`, `source_last_synced_at`
- 风险治理：`risk_rating`, `risk_explanation`, `review_status`, `reviewed_by`, `reviewed_at`
- 使用边界：`direct_use`, `downstream_use`, `out_of_scope_use`
- 数据增强溯源：`augmentation_confidence`, `augmentation_source_citations[]`, `verified_by_human`

Reasoning：
- 这正好承接你 proposal 里“confidence + citations + human-in-the-loop”。
- 也让导入字段不是“黑盒补全”，而是审计友好的增强。

## 3.2 Dataset Object（你标了 TBD）：建议补齐复现与合规最小字段
你当前 Dataset 结构有基础字段，但建议新增：
- `snapshot_hash`（数据快照哈希）
- `splits`（train/val/test 的版本信息）
- `sensitive_attributes[]`, `pii_presence`
- `known_limitations`
- `lineage`（来源链，如 HF dataset revision 或外部 DOI）

Reasoning：
- Datasheet 成为一等节点后，最常被追问的是“这个数据版本能不能复现”。
- `snapshot_hash + lineage` 是最省成本且最有说服力的答案。

## 3.3 Model Requirements Object：建议区分“运行依赖”与“安全依赖”
新增：
- `dependency_lockfile_uri`
- `container_image`, `container_digest`
- `sbom_uri`
- `dependency_vuln_summary`（critical/high/medium/low）

Reasoning：
- 你要求加入 security/vulnerability，最自然承载点就是依赖与容器。
- 同时能和后续 `SecurityAssessment` 节点挂接。

## 3.4 Experiment Object：建议拆分 deployment_data 语义层
你当前 Experiment 里 `deployment_data` 比较细，但建议再增加：
- `deployment_context`（edge/cloud/device type）
- `workload_profile`（batch/stream/realtime）
- `energy_per_inference`（比总能耗更可比）
- `dataset_slice`（本次实验使用的数据子集/版本）

Reasoning：
- 仅记录总功耗，跨实验可比性差；`per inference` 更适合论文分析。
- `dataset_slice` 能避免“同模型不同数据导致结果不可比”的争议。

---

## 4. 建议在 proposal 里补充的“新增节点”（你现在文本尚未显式列出）

为了满足“atomic CRUD + reproducibility + security”，建议在对象列表后追加 4 个节点：
1. `TrainingRun`
2. `EvaluationReport`
3. `SecurityAssessment`
4. `ReproducibilityProfile`

Reasoning：
- 如果都塞回 `ModelCard` 或 `Experiment`，最终又会回到 monolithic 更新模式。
- 这 4 类信息天然是“多次发生、需要时序追踪”的，独立节点更合适。

---

## 5. 对“Represent versions”部分的具体增强建议

你目前写了 HF 用 hash，但建议进一步明确“版本标识三层制”：
- Logical version：`name + semantic version`
- Artifact version：`artifact_sha256`
- Source revision：`git commit / HF revision`

并定义关系：
- `REVISION_OF`（同模型演进）
- `TRANSFORMATIVE_USE_OF`（衍生/迁移/微调来源）
- `ALTERNATE_OF`（功能类似但来源不同）

Reasoning：
- 单一 hash 不能表达“语义版本”和“来源版本”的区别。
- 三层标识能同时服务工程部署与学术溯源。

---

## 6. 建议把“MLHub 集成”写成明确接口契约

新增一个小节：`MLHub-facing APIs (Phase 1 MVP)`，至少列出：
- `GET /modelcards?task=&risk_rating=&framework=`
- `GET /modelcards/{id}`
- `GET /modelcards/{id}/deployability`
- `GET /datasheets/{id}`
- `GET /models/{id}/security-summary`
- `GET /models/{id}/reproducibility-summary`

Reasoning：
- 你已经写了“Expose FastAPI endpoints to MLHub”，但没有列最小查询面。
- 没有接口契约，后面极易出现“数据做了但 MLHub 不可用”的交付偏差。

---

## 7. 受控边词汇（你 proposal 已提到，建议直接定稿）

建议在 proposal 里直接加入一份“第一版 edge vocabulary”，避免后面各自命名：
- `MODELCARD_DESCRIBES_MODEL`
- `MODELCARD_TRAINS_ON_DATASET`
- `MODEL_HAS_TRAINING_RUN`
- `MODEL_HAS_EVALUATION`
- `MODEL_HAS_SECURITY_ASSESSMENT`
- `MODEL_HAS_REPRO_PROFILE`
- `MODEL_DEPLOYED_AS`
- `DEPLOYMENT_ON_DEVICE`
- `EXPERIMENT_USES_MODEL`
- `EXPERIMENT_SUBMITTED_BY`
- `MODELCARD_REVISION_OF`
- `MODELCARD_TRANSFORMATIVE_USE_OF`

Reasoning：
- 当前仓库已有关系命名不一致历史问题，必须在 proposal 阶段就锁定。

---

## 8. 与你新版 proposal 对齐后的优先级（建议直接写入文档）

## P0（现在到 Aug 2026，必须完成）
- 原子 CRUD（ModelCard/Model/Datasheet/Experiment）
- 6 个 HF/ICICLE 对象手工建卡
- Edge vocabulary v1
- 可复现字段最小集：`code_commit_sha/dataset_hash/environment/seed`
- 安全字段最小集：`critical/high vuln count`

## P1（Sep-Oct 2026）
- 自动化同步（Watcher 或替代机制）
- 字段增强 + confidence/citation + HITL
- Deployment 元数据扩展

## P2（后续）
- JWT/RBAC + K8s 安全发布

Reasoning：
- 完全对齐你“隐私层暂不在 immediate agenda”的最新口径。

---

## 9. 建议直接替换/新增到 `proposal.md` 的几处文字

1. 在 `Privacy Layer` 下新增一句：
- `Deferred to Phase 3; excluded from Aug 2026 delivery scope.`

2. 在 `Ingest model cards from Hugging Face and GitHub` 下新增验收句：
- `Phase 1 acceptance: 6 manually curated HF/ICICLE cards with provenance, confidence score, and human verification status.`

3. 在 `Represent versions` 下新增：
- `Adopt 3-part version identity: semantic version + artifact hash + source revision.`

4. 在 `Success Criteria` 下补充量化指标条目（覆盖率、完整率、新鲜度、反馈闭环周期）。

---

## 10. 最后建议
你这版 proposal 的方向是对的，当前最需要的是把“方向”转成“可验收的 schema + API + 指标”。

下一步最有效动作：
1. 先冻结 `ModelCard/Datasheet/Model/Experiment` 的 P0 字段
2. 同时冻结 edge vocabulary v1
3. 给 MLHub 出 Phase 1 API contract（只保留最小查询面）
4. 用 6 个手工对象跑一轮验收，倒逼字段精炼
