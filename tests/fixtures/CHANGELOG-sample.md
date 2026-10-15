# Changelog

## [0.6.0] - 2026-10-15

### Added

- 子 Agent chip 支持按名称筛选
  EN: Sub-agent chips can now be filtered by name
- 远程审批新增批量模式
  一次勾选多条待审请求，统一放行或驳回
  批量操作会记录单条审计日志
  EN: Remote approvals gain a batch mode
- 观察台支持时间轴回放
  EN: The observatory supports timeline replay,
    reopening any sub-agent run from its chip

### Fixed

- 修复远程审批超时后状态不同步
  EN: Fixed approval status drifting out of sync after a timeout
- 修复观察台在深色模式下时间轴错位
  EN: Fixed the timeline misaligning in dark mode

## [0.5.9] - 2026-10-12

### Added

- 审批队列支持按提交人分组
- 子 Agent chip 支持固定到侧栏
  EN: Sub-agent chips can now be pinned to the sidebar
- 观察台新增运行时长统计

## [0.5.5] - 2026-10-10

### Added

- 子 Agent 运行 chip 与观察台
- 远程审批支持排队

### Fixed

- 完成识别修复：teammate 完成后 chip 永挂
